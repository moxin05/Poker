"""
数据库连接与初始化
"""
import os
import sqlite3
from app.config import DB_PATH


def get_db():
    """获取数据库连接"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """初始化数据库表结构"""
    conn = get_db()
    c = conn.cursor()

    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            phone           TEXT PRIMARY KEY,
            nickname        TEXT NOT NULL DEFAULT '',
            password_hash   TEXT NOT NULL DEFAULT '',
            total_games     INTEGER DEFAULT 0,
            total_hands     INTEGER DEFAULT 0,
            hands_won       INTEGER DEFAULT 0,
            total_profit    INTEGER DEFAULT 0,
            total_borrowed  INTEGER DEFAULT 0,
            biggest_win     INTEGER DEFAULT 0,
            biggest_loss    INTEGER DEFAULT 0,
            created_at      REAL DEFAULT 0,
            last_played_at  REAL DEFAULT 0
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS game_records (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id     TEXT,
            phone       TEXT,
            profit      INTEGER DEFAULT 0,
            hands_played INTEGER DEFAULT 0,
            hands_won   INTEGER DEFAULT 0,
            borrowed    INTEGER DEFAULT 0,
            duration    INTEGER DEFAULT 0,
            played_at   REAL DEFAULT 0,
            FOREIGN KEY (phone) REFERENCES users(phone)
        )
    ''')

    conn.commit()
    conn.close()
    print("[数据库] 初始化完成")
