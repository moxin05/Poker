"""
游戏统计相关数据库操作
"""
import time
from app.db.connection import get_db


def record_game_result(room_id, phone, profit, hands_played, hands_won, borrowed, duration):
    """记录一场对局结果"""
    now = time.time()
    conn = get_db()
    c = conn.cursor()

    c.execute('''
        INSERT INTO game_records
            (room_id, phone, profit, hands_played, hands_won, borrowed, duration, played_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (room_id, phone, profit, hands_played, hands_won, borrowed, duration, now))

    c.execute('SELECT * FROM users WHERE phone = ?', (phone,))
    user = c.fetchone()
    if user:
        c.execute('''
            UPDATE users SET
                total_games = ?, total_hands = ?, hands_won = ?,
                total_profit = ?, total_borrowed = ?,
                biggest_win = ?, biggest_loss = ?,
                last_played_at = ?
            WHERE phone = ?
        ''', (
            user['total_games'] + 1,
            user['total_hands'] + hands_played,
            user['hands_won'] + hands_won,
            user['total_profit'] + profit,
            user['total_borrowed'] + borrowed,
            max(user['biggest_win'], profit) if profit > 0 else user['biggest_win'],
            min(user['biggest_loss'], profit) if profit < 0 else user['biggest_loss'],
            now, phone,
        ))

    conn.commit()
    conn.close()


def get_user_stats(phone):
    """获取用户统计"""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE phone = ?', (phone,))
    row = c.fetchone()
    conn.close()

    if not row:
        return dict(nickname='', phone=phone, total_games=0, total_hands=0, hands_won=0,
                     win_rate=0, total_profit=0, total_borrowed=0,
                     biggest_win=0, biggest_loss=0, net_profit=0)

    total = row['total_hands']
    won = row['hands_won']
    return {
        'nickname':       row['nickname'],
        'phone':          row['phone'],
        'total_games':    row['total_games'],
        'total_hands':    total,
        'hands_won':      won,
        'win_rate':       round(won / total * 100, 1) if total > 0 else 0,
        'total_profit':   row['total_profit'],
        'total_borrowed': row['total_borrowed'],
        'biggest_win':    row['biggest_win'],
        'biggest_loss':   row['biggest_loss'],
        'net_profit':     row['total_profit'],
    }


def get_user_history(phone, limit=20):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM game_records WHERE phone = ? ORDER BY played_at DESC LIMIT ?', (phone, limit))
    rows = c.fetchall()
    conn.close()
    return [dict(room_id=r['room_id'], profit=r['profit'], hands_played=r['hands_played'],
                 hands_won=r['hands_won'], borrowed=r['borrowed'], duration=r['duration'],
                 played_at=r['played_at']) for r in rows]


def get_leaderboard(limit=20):
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        SELECT nickname, phone, total_games, total_hands, hands_won, total_profit, total_borrowed
        FROM users ORDER BY total_profit DESC LIMIT ?
    ''', (limit,))
    rows = c.fetchall()
    conn.close()
    return [dict(nickname=r['nickname'], total_games=r['total_games'], total_hands=r['total_hands'],
                 hands_won=r['hands_won'], total_profit=r['total_profit'], total_borrowed=r['total_borrowed'],
                 win_rate=round(r['hands_won'] / r['total_hands'] * 100, 1) if r['total_hands'] > 0 else 0
                 ) for r in rows]
