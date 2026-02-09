"""
房间事件: 创建、加入、离开、开始游戏
"""
import asyncio
from app.server import sio
from app.config import DEFAULT_GAME_DURATION, MIN_GAME_DURATION, MAX_GAME_DURATION
from app.game import Room, Player, generate_room_id
from app.services import room_manager as rm
from app.services.game_flow import (
    broadcast_room_state, handle_auto_advance,
    end_game_session, room_timer,
)


@sio.event
async def create_room(sid, data=None):
    info = rm.get_player(sid)
    if not info:
        await sio.emit('error', {'message': '请先登录'}, room=sid)
        return

    if info.get('room_id'):
        await leave_room(sid)

    room_id = generate_room_id()
    while room_id in rm.rooms:
        room_id = generate_room_id()

    room = Room(room_id, sid)
    room.add_player(Player(sid, info['nickname']))
    rm.rooms[room_id] = room
    info['room_id'] = room_id

    await sio.enter_room(sid, room_id)
    await sio.emit('room_joined', room.get_state_for_player(sid), room=sid)
    print(f'[房间] {info["nickname"]} 创建了房间 {room_id}')


@sio.event
async def join_room(sid, data):
    info = rm.get_player(sid)
    if not info:
        await sio.emit('error', {'message': '请先登录'}, room=sid)
        return

    room_id = data.get('room_id', '').strip()
    room = rm.get_room(room_id)
    if not room:
        await sio.emit('error', {'message': '房间不存在'}, room=sid)
        return
    if room.game_state == 'finished':
        await sio.emit('error', {'message': '对局已结束'}, room=sid)
        return
    if len(room.players) >= 9:
        await sio.emit('error', {'message': '房间已满（最多9人）'}, room=sid)
        return

    if info.get('room_id'):
        await leave_room(sid)

    player = Player(sid, info['nickname'])
    room.add_player(player)
    info['room_id'] = room_id

    await sio.enter_room(sid, room_id)
    await broadcast_room_state(room)
    print(f'[房间] {info["nickname"]} 加入了房间 {room_id}')


@sio.event
async def leave_room(sid, data=None):
    info = rm.get_player(sid)
    if not info:
        return
    room_id = info.get('room_id')
    room = rm.get_room(room_id) if room_id else None
    if not room:
        return

    player = room.get_player_by_sid(sid)
    if player and room.game_state not in ('waiting', 'showdown', 'finished'):
        player.is_folded = True
        if len(room.active_players()) == 1:
            room.determine_winners()

    room.remove_player(sid)
    info['room_id'] = None
    await sio.leave_room(sid, room_id)

    if not room.players:
        rm.cleanup_room(room_id)
    elif len(room.players) < 2 and room.is_game_active:
        await end_game_session(room)
    else:
        await broadcast_room_state(room)

    await sio.emit('left_room', {}, room=sid)


@sio.event
async def start_game(sid, data=None):
    info = rm.get_player(sid)
    if not info:
        return
    room = rm.get_room(info.get('room_id'))
    if not room:
        return
    if room.host_sid != sid:
        await sio.emit('error', {'message': '只有房主才能开始游戏'}, room=sid)
        return
    if len(room.players) < 2:
        await sio.emit('error', {'message': '至少需要2名玩家才能开始'}, room=sid)
        return

    duration = DEFAULT_GAME_DURATION
    if data and isinstance(data, dict):
        duration = data.get('duration', DEFAULT_GAME_DURATION)
    duration = max(MIN_GAME_DURATION, min(MAX_GAME_DURATION, int(duration)))

    result = room.start_game_session(duration)
    rm.timers[room.room_id] = asyncio.create_task(room_timer(room.room_id))

    if result == 'auto_advance':
        await handle_auto_advance(room)
    elif result:
        await broadcast_room_state(room)
    else:
        await sio.emit('error', {'message': '无法开始游戏'}, room=sid)
