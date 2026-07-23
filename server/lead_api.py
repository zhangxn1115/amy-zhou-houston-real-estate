#!/usr/bin/env python3
"""Small same-origin lead intake service for amyzhouhomes.net."""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import sqlite3
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ALLOWED_ORIGIN = "https://amyzhouhomes.net"
DATABASE = Path(os.environ.get("LEAD_DATABASE", "/var/lib/amyzhou-leads/leads.sqlite3"))
SALT_FILE = Path(os.environ.get("LEAD_HASH_SALT_FILE", "/var/lib/amyzhou-leads/hash-salt"))
MAX_BODY = 16 * 1024
ALLOWED_INTENTS = {"", "自住", "投资", "学区房", "新房", "其他"}
ALLOWED_TIMEFRAMES = {"", "3个月内", "3至6个月", "半年至一年", "先了解市场"}


def clean_text(value: object, maximum: int) -> str:
    if not isinstance(value, str):
        return ""
    cleaned = " ".join(value.replace("\x00", "").split())
    return cleaned[:maximum]


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
          ip_hash TEXT NOT NULL
        )
        """
    )
    connection.execute(
        "CREATE INDEX IF NOT EXISTS leads_created_epoch_idx ON leads(created_epoch)"
    )
    connection.execute(
        "CREATE INDEX IF NOT EXISTS leads_ip_hash_idx ON leads(ip_hash)"
    )
    return connection


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

        name = clean_text(payload.get("name"), 60)
        contact = clean_text(payload.get("contact"), 120)
        intent = clean_text(payload.get("intent"), 20)
        timeframe = clean_text(payload.get("timeframe"), 20)
        message = clean_text(payload.get("message"), 600)
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

        self.send_json(201, {"ok": True})


if __name__ == "__main__":
    port = int(os.environ.get("LEAD_PORT", "8788"))
    server = ThreadingHTTPServer(("127.0.0.1", port), LeadHandler)
    server.daemon_threads = True
    print(f"Amy lead intake listening on 127.0.0.1:{port}", flush=True)
    server.serve_forever()
