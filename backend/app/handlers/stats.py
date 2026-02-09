"""
统计事件: 个人统计、排行榜
"""
from app.server import sio
from app.db import get_user_stats, get_user_history, get_leaderboard
from app.services import room_manager as rm


@sio.event
async def get_stats(sid, data=None):
    info = rm.get_player(sid)
    if not info:
        return
    phone = info['phone']
    await sio.emit('stats_data', {
        'stats': get_user_stats(phone),
        'history': get_user_history(phone),
    }, room=sid)


@sio.event
async def get_rankings(sid, data=None):
    await sio.emit('rankings_data', {'rankings': get_leaderboard()}, room=sid)
