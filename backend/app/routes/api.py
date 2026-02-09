"""
HTTP REST API 路由
"""
from app.server import app
from app.db import get_user_stats, get_leaderboard
from app.services import room_manager as rm


@app.get("/api/health")
async def health():
    return {"status": "ok", "rooms": len(rm.rooms), "players": len(rm.players)}


@app.get("/api/rooms")
async def list_rooms():
    return {
        rid: {
            'player_count': len(room.players),
            'state': room.game_state,
            'remaining_time': room.get_remaining_time(),
        }
        for rid, room in rm.rooms.items()
    }


@app.get("/api/stats/{username}")
async def user_stats(username: str):
    return get_user_stats(username)


@app.get("/api/leaderboard")
async def leaderboard():
    return get_leaderboard()
