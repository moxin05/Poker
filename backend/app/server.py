"""
FastAPI + Socket.IO 服务器实例初始化
"""
import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS

# FastAPI 应用
app = FastAPI(title="Texas Hold'em Poker")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO 服务
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
)

# ASGI 组合应用
socket_app = socketio.ASGIApp(sio, app)
