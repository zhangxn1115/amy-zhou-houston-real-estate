#!/usr/bin/env python3
"""Small same-origin lead intake service for amyzhouhomes.net."""

from __future__ import annotations

import hashlib
import html
import json
import os
import secrets
import smtplib
import sqlite3
import ssl
import time
from datetime import datetime, timezone
from email.message import EmailMessage
from email.utils import format_datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Event, Thread

ALLOWED_ORIGIN = "https://amyzhouhomes.net"
DATABASE = Path(os.environ.get("LEAD_DATABASE", "/var/lib/amyzhou-leads/leads.sqlite3"))
SALT_FILE = Path(os.environ.get("LEAD_HASH_SALT_FILE", "/var/lib/amyzhou-leads/hash-salt"))
MAX_BODY = 16 * 1024
ALLOWED_INTENTS = {"通勤", "学区", "投资"}
ALLOWED_TIMEFRAMES = {"", "3个月内", "3至6个月", "半年至一年", "先了解市场"}
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
LEAD_EMAIL_TO = os.environ.get("LEAD_EMAIL_TO", "ningimeng12@gmail.com")
EMAIL_ENABLED = bool(SMTP_USERNAME and SMTP_PASSWORD and LEAD_EMAIL_TO)
EMAIL_WAKE = Event()


def clean_text(value: object, maximum: int) -> str:
    if not isinstance(value, str):
        return ""
    cleaned = " ".join(value.replace("\x00", "").split())
    return cleaned[:maximum]


def weighted_name_length(value: str) -> int:
    return sum(
        2
        if (
            "\u3400" <= character <= "\u4dbf"
            or "\u4e00" <= character <= "\u9fff"
            or "\uf900" <= character <= "\ufaff"
        )
        else 1
        for character in value
    )


def load_salt() -> bytes:
    SALT_FILE.parent.mkdir(parents=True, exist_ok=True)
    if SALT_FILE.exists():
        return SALT_FILE.read_bytes()
    salt = secrets.token_bytes(32)
    old_umask = os.umask(0o077)
    try:
        SALT_FILE.write_bytes(salt)
    finally:
        os.umask(old_umask)
    return salt


SALT = load_salt()


def connect_database() -> sqlite3.Connection:
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE, timeout=5)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA busy_timeout=5000")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS leads (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT NOT NULL,
          created_epoch INTEGER NOT NULL,
          name TEXT NOT NULL,
          contact TEXT NOT NULL,
          intent TEXT NOT NULL,
          timeframe TEXT NOT NULL,
          message TEXT NOT NULL,
          ip_hash TEXT NOT NULL,
          email_status TEXT NOT NULL DEFAULT 'pending',
          email_attempts INTEGER NOT NULL DEFAULT 0,
          last_email_error TEXT NOT NULL DEFAULT ''
        )
        """
    )
    columns = {
        row["name"]
        for row in connection.execute("PRAGMA table_info(leads)").fetchall()
    }
    migrations = {
        "email_status": "TEXT NOT NULL DEFAULT 'pending'",
        "email_attempts": "INTEGER NOT NULL DEFAULT 0",
        "last_email_error": "TEXT NOT NULL DEFAULT ''",
    }
    for column, definition in migrations.items():
        if column not in columns:
            connection.execute(f"ALTER TABLE leads ADD COLUMN {column} {definition}")
    connection.execute(
        "CREATE INDEX IF NOT EXISTS leads_created_epoch_idx ON leads(created_epoch)"
    )
    connection.execute(
        "CREATE INDEX IF NOT EXISTS leads_ip_hash_idx ON leads(ip_hash)"
    )
    return connection


def email_table_row(label: str, value: str) -> str:
    return (
        "<tr>"
        f"<th style=\"padding:10px 12px;text-align:left;color:#526760;"
        f"border-bottom:1px solid #e1ddd4;width:110px\">{html.escape(label)}</th>"
        f"<td style=\"padding:10px 12px;color:#173a32;border-bottom:1px solid #e1ddd4\">"
        f"{html.escape(value) or '—'}</td>"
        "</tr>"
    )


def send_lead_email(lead: sqlite3.Row) -> None:
    message = EmailMessage()
    message["Subject"] = "[Amy Zhou Homes] 新客户置业咨询"
    message["From"] = f"Amy Zhou Homes <{SMTP_USERNAME}>"
    message["To"] = LEAD_EMAIL_TO
    message["Date"] = format_datetime(datetime.now(timezone.utc))
    message["X-Amy-Lead-ID"] = str(lead["id"])

    fields = [
        ("提交时间", lead["created_at"]),
        ("客户姓名", lead["name"]),
        ("联系方式", lead["contact"]),
        ("主要关注", lead["intent"]),
        ("计划时间", lead["timeframe"]),
        ("具体需求", lead["message"]),
    ]
    plain = "Amy Zhou Homes 收到新的客户置业咨询：\n\n" + "\n".join(
        f"{label}：{value or '—'}" for label, value in fields
    )
    message.set_content(plain)
    rows = "".join(email_table_row(label, value) for label, value in fields)
    message.add_alternative(
        f"""
        <!doctype html>
        <html lang="zh-CN">
          <body style="margin:0;padding:28px;background:#f3efe7;font-family:Arial,'PingFang SC',sans-serif">
            <div style="max-width:640px;margin:auto;background:#fff;border-top:5px solid #173a32">
              <div style="padding:24px 26px 14px">
                <div style="font-size:12px;letter-spacing:2px;color:#8a6250">AMY ZHOU HOMES</div>
                <h1 style="margin:12px 0 8px;color:#173a32;font-size:24px">新的客户置业咨询</h1>
                <p style="margin:0;color:#697a74;font-size:13px">客户已通过 amyzhouhomes.net 提交表单</p>
              </div>
              <table role="presentation" style="width:calc(100% - 52px);margin:8px 26px 26px;border-collapse:collapse;font-size:14px">
                {rows}
              </table>
            </div>
          </body>
        </html>
        """,
        subtype="html",
    )

    context = ssl.create_default_context()
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15, context=context) as smtp:
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(message)


def deliver_pending_emails() -> None:
    if not EMAIL_ENABLED:
        return
    with connect_database() as database:
        leads = database.execute(
            """
            SELECT id, created_at, name, contact, intent, timeframe, message,
                   email_status, email_attempts
            FROM leads
            WHERE email_status IN ('pending', 'failed') AND email_attempts < 12
            ORDER BY id
            LIMIT 10
            """
        ).fetchall()

    for lead in leads:
        try:
            send_lead_email(lead)
        except (OSError, smtplib.SMTPException) as error:
            error_name = type(error).__name__
            with connect_database() as database:
                database.execute(
                    """
                    UPDATE leads
                    SET email_status = 'failed',
                        email_attempts = email_attempts + 1,
                        last_email_error = ?
                    WHERE id = ?
                    """,
                    (error_name[:80], lead["id"]),
                )
            print(
                f"Email delivery failed for lead {lead['id']}: {error_name}",
                flush=True,
            )
        else:
            with connect_database() as database:
                database.execute(
                    """
                    UPDATE leads
                    SET email_status = 'sent',
                        email_attempts = email_attempts + 1,
                        last_email_error = ''
                    WHERE id = ?
                    """,
                    (lead["id"],),
                )
            print(f"Email delivered for lead {lead['id']}", flush=True)


def email_worker() -> None:
    while True:
        deliver_pending_emails()
        EMAIL_WAKE.wait(300)
        EMAIL_WAKE.clear()


class LeadHandler(BaseHTTPRequestHandler):
    server_version = "AmyLeadIntake"
    sys_version = ""

    def log_message(self, format_string: str, *args: object) -> None:
        # Never log submitted form contents.
        print(f"{self.address_string()} - {format_string % args}", flush=True)

    def send_json(self, status: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Security-Policy", "default-src 'none'")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        self.send_json(405, {"message": "Method not allowed"})

    def do_POST(self) -> None:
        if self.path != "/api/leads":
            self.send_json(404, {"message": "Not found"})
            return
        if self.headers.get("Origin") != ALLOWED_ORIGIN:
            self.send_json(403, {"message": "提交来源验证失败，请刷新页面后重试。"})
            return
        if "application/json" not in self.headers.get("Content-Type", "").lower():
            self.send_json(415, {"message": "Unsupported content type"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        if content_length <= 0 or content_length > MAX_BODY:
            self.send_json(413, {"message": "提交内容过大。"})
            return

        try:
            payload = json.loads(self.rfile.read(content_length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"message": "提交内容格式不正确。"})
            return
        if not isinstance(payload, dict):
            self.send_json(400, {"message": "提交内容格式不正确。"})
            return

        # Hidden field: real visitors never fill it.
        if clean_text(payload.get("website"), 200):
            self.send_json(200, {"ok": True})
            return

        raw_name = payload.get("name", "")
        raw_contact = payload.get("contact", "")
        if not isinstance(raw_name, str) or weighted_name_length(raw_name) > 10:
            self.send_json(422, {"message": "姓名最多填写5个汉字或10个英文字符。"})
            return
        if not isinstance(raw_contact, str) or len(raw_contact) > 30:
            self.send_json(422, {"message": "联系方式请控制在30个字符以内。"})
            return
        name = clean_text(raw_name, 10)
        contact = clean_text(raw_contact, 30)
        intent = clean_text(payload.get("intent"), 20)
        timeframe = clean_text(payload.get("timeframe"), 20)
        raw_message = payload.get("message", "")
        if not isinstance(raw_message, str) or len(raw_message) > 100:
            self.send_json(422, {"message": "具体需求请控制在100字以内。"})
            return
        message = clean_text(raw_message, 100)
        consent = payload.get("consent") is True
        try:
            started_at = int(payload.get("startedAt", 0))
        except (TypeError, ValueError):
            started_at = 0
        elapsed = int(time.time() * 1000) - started_at

        if len(name) < 1 or len(contact) < 3:
            self.send_json(422, {"message": "请填写姓名和有效的联系方式。"})
            return
        if intent not in ALLOWED_INTENTS or timeframe not in ALLOWED_TIMEFRAMES:
            self.send_json(422, {"message": "请选择有效的置业需求。"})
            return
        if not consent:
            self.send_json(422, {"message": "请确认同意 Amy 与您联系。"})
            return
        if elapsed < 2500 or elapsed > 24 * 60 * 60 * 1000:
            self.send_json(422, {"message": "页面停留时间异常，请刷新后重新填写。"})
            return

        forwarded_ip = self.headers.get("X-Real-IP", self.client_address[0])
        ip_hash = hashlib.sha256(SALT + forwarded_ip.encode("utf-8")).hexdigest()
        now_epoch = int(time.time())
        created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

        with connect_database() as database:
            recent = database.execute(
                "SELECT COUNT(*) FROM leads WHERE ip_hash = ? AND created_epoch >= ?",
                (ip_hash, now_epoch - 3600),
            ).fetchone()[0]
            if recent >= 8:
                self.send_json(429, {"message": "提交次数较多，请稍后再试或直接添加 Amy 微信。"})
                return
            database.execute(
                """
                INSERT INTO leads
                  (created_at, created_epoch, name, contact, intent, timeframe, message, ip_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (created_at, now_epoch, name, contact, intent, timeframe, message, ip_hash),
            )
            # Customer data is not retained indefinitely.
            database.execute(
                "DELETE FROM leads WHERE created_epoch < ?",
                (now_epoch - 400 * 24 * 60 * 60,),
            )

        EMAIL_WAKE.set()
        self.send_json(201, {"ok": True})


if __name__ == "__main__":
    with connect_database():
        pass
    if EMAIL_ENABLED:
        Thread(target=email_worker, name="lead-email-worker", daemon=True).start()
        print(f"Lead email delivery enabled for {LEAD_EMAIL_TO}", flush=True)
    else:
        print("Lead email delivery pending SMTP credentials", flush=True)
    port = int(os.environ.get("LEAD_PORT", "8788"))
    server = ThreadingHTTPServer(("127.0.0.1", port), LeadHandler)
    server.daemon_threads = True
    print(f"Amy lead intake listening on 127.0.0.1:{port}", flush=True)
    server.serve_forever()
