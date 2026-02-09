"""
房间管理器 - 管理所有房间的内存状态
"""
import asyncio

# 内存存储
players: dict = {}    # sid -> {'phone': str, 'nickname': str, 'room_id': str|None}
rooms: dict = {}      # room_id -> Room
timers: dict = {}     # room_id -> asyncio.Task


def get_player(sid):
    return players.get(sid)


def get_room(room_id):
    return rooms.get(room_id)


def cleanup_timer(room_id):
    """取消并清理房间计时器"""
    if room_id in timers:
        timers[room_id].cancel()
        del timers[room_id]


def cleanup_room(room_id):
    """完全清理房间"""
    cleanup_timer(room_id)
    rooms.pop(room_id, None)
