"""
用户认证: 手机号注册 / 登录
"""
import hashlib
import re
import time

from app.config import PASSWORD_SALT, PASSWORD_MIN_LEN, NICKNAME_MIN_LEN, NICKNAME_MAX_LEN
from app.db.connection import get_db

_PHONE_RE = re.compile(r'^1[3-9]\d{9}$')


def _hash(text):
    return hashlib.sha256(f'{PASSWORD_SALT}:{text}'.encode()).hexdigest()


def register_user(phone, nickname, password):
    """
    手机号注册。
    Returns: (success, message)
    """
    if not phone or not _PHONE_RE.match(phone):
        return False, '请输入正确的手机号'
    if not nickname or not (NICKNAME_MIN_LEN <= len(nickname) <= NICKNAME_MAX_LEN):
        return False, f'昵称长度需要{NICKNAME_MIN_LEN}-{NICKNAME_MAX_LEN}个字符'
    if not password or len(password) < PASSWORD_MIN_LEN:
        return False, f'密码长度至少{PASSWORD_MIN_LEN}个字符'

    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT phone FROM users WHERE phone = ?', (phone,))
    if c.fetchone():
        conn.close()
        return False, '该手机号已注册'

    c.execute(
        'INSERT INTO users (phone, nickname, password_hash, created_at) VALUES (?, ?, ?, ?)',
        (phone, nickname.strip(), _hash(password), time.time()),
    )
    conn.commit()
    conn.close()
    return True, '注册成功'


def authenticate_user(phone, password):
    """
    手机号密码登录。
    Returns: (success, message, nickname)
    """
    if not phone or not password:
        return False, '请输入手机号和密码', None

    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT password_hash, nickname FROM users WHERE phone = ?', (phone,))
    row = c.fetchone()
    conn.close()

    if not row:
        return False, '该手机号未注册', None
    if row['password_hash'] != _hash(password):
        return False, '密码错误', None
    return True, '登录成功', row['nickname']
