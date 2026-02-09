"""
德州扑克服务器入口
"""
import uvicorn
from app.config import HOST, PORT
from app.server import socket_app
from app.db import init_db
from app.handlers import register_all_handlers
import app.routes.api  # noqa: F401  注册 HTTP 路由


def main():
    # 初始化数据库
    init_db()

    # 注册 Socket.IO 事件处理器
    register_all_handlers()

    # 启动服务
    print("🃏 德州扑克服务器启动中...")
    print(f"📡 http://{HOST}:{PORT}")
    uvicorn.run(socket_app, host=HOST, port=PORT, log_level='info')


if __name__ == '__main__':
    main()
