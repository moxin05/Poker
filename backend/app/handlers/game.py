"""
游戏事件: 玩家行动、赊账、下一手
"""
import asyncio
from app.server import sio
from app.config import SHOWDOWN_DELAY
from app.services import room_manager as rm
from app.services.game_flow import (
    broadcast_room_state, handle_auto_advance,
    auto_next_hand, end_game_session,
)


@sio.event
async def player_action(sid, data):
    info = rm.get_player(sid)
    if not info:
        return
    room = rm.get_room(info.get('room_id'))
    if not room:
        return

    result = room.process_action(sid, data.get('action'), data.get('amount', 0))

    if result is None:
        await sio.emit('error', {'message': '无效操作'}, room=sid)
        return

    if result == 'hand_over':
        await broadcast_room_state(room)
        if room.is_game_active:
            asyncio.create_task(auto_next_hand(room))
        elif room.game_state == 'showdown':
            await asyncio.sleep(SHOWDOWN_DELAY)
            await end_game_session(room)
        return

    if result == 'round_complete':
        room.advance_round()
        await broadcast_room_state(room)
        if room.game_state == 'showdown':
            if room.is_game_active:
                asyncio.create_task(auto_next_hand(room))
            else:
                await asyncio.sleep(SHOWDOWN_DELAY)
                await end_game_session(room)
        return

    await broadcast_room_state(room)


@sio.event
async def next_hand(sid, data=None):
    info = rm.get_player(sid)
    if not info:
        return
    room = rm.get_room(info.get('room_id'))
    if not room or room.game_state != 'showdown':
        return

    result = room.next_hand()
    if result in ('time_up', 'not_enough_players'):
        await end_game_session(room)
    elif result == 'auto_advance':
        await handle_auto_advance(room)
    elif result:
        await broadcast_room_state(room)


@sio.event
async def borrow_chips(sid, data=None):
    info = rm.get_player(sid)
    if not info:
        return
    room = rm.get_room(info.get('room_id'))
    if not room:
        return
    player = room.get_player_by_sid(sid)
    if not player:
        return

    amount = player.borrow_chips()
    await sio.emit('borrow_success', {
        'amount': amount, 'total_borrowed': player.total_borrowed, 'chips': player.chips,
    }, room=sid)
    await broadcast_room_state(room)
    print(f'[赊账] {player.username} +{amount}，累计 {player.total_borrowed}')
