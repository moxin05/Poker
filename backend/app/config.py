"""
全局配置常量
"""
import os

# 服务器
HOST = '0.0.0.0'
PORT = 8000
CORS_ORIGINS = ['*']

# 数据库
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'poker.db')

# 游戏
INITIAL_CHIPS = 1000
BORROW_AMOUNT = 500
SMALL_BLIND = 5
BIG_BLIND = 10
MAX_PLAYERS_PER_ROOM = 9
MIN_GAME_DURATION = 1      # 分钟
MAX_GAME_DURATION = 120     # 分钟
DEFAULT_GAME_DURATION = 10  # 分钟
SHOWDOWN_DELAY = 4          # 秒

# 认证
PASSWORD_SALT = 'poker_texas_holdem_2026'
PASSWORD_MIN_LEN = 4
NICKNAME_MIN_LEN = 1
NICKNAME_MAX_LEN = 12

# 房间号
ROOM_ID_LENGTH = 6
