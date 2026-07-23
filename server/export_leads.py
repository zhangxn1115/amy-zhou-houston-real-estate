#!/usr/bin/env python3
"""Export Amy Zhou website leads as CSV without exposing IP hashes."""

import csv
import os
import sqlite3
import sys

database_path = os.environ.get(
    "LEAD_DATABASE", "/var/lib/amyzhou-leads/leads.sqlite3"
)

with sqlite3.connect(database_path) as database:
    rows = database.execute(
        """
        SELECT id, created_at, name, contact, intent, timeframe, message
        FROM leads
        ORDER BY id DESC
        """
    )
    writer = csv.writer(sys.stdout)
    writer.writerow(
        ["编号", "提交时间（UTC）", "姓名", "联系方式", "置业目的", "计划时间", "具体需求"]
    )
    writer.writerows(rows)
