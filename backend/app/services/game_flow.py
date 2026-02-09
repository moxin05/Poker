"""
游戏流程辅助 - 广播状态、自动推进、结算等
"""
import asyncio
from app.server import sio
from app.config import SHOWDOWN_DELAY
from app.db import record_game_result
from app.services import room_manager as rm


async def broadcast_room_state(room):
    """向房间内每个玩家发送个性化的游戏状态"""
    for p in room.players:
        await sio.emit('game_state', room.get_state_for_player(p.sid), room=p.sid)


async def handle_auto_advance(room):
    """处理自动推进（全部 all-in 的情况）"""
    while room.game_state not in ('waiting', 'showdown', 'finished'):
        if len(room.active_players_with_chips()) <= 1:
            room.advance_round()
        else:
            break
    await broadcast_room_state(room)


async def auto_next_hand(room):
    """showdown 后自动开始下一手"""
    await asyncio.sleep(SHOWDOWN_DELAY)

    if room.game_state != 'showdown':
        return
    if not room.is_game_active:
        return
    if room.room_id not in rm.rooms:
        return

    result = room.next_hand()
    if result in ('time_up', 'not_enough_players'):
        await end_game_session(room)
    elif result == 'auto_advance':
        await handle_auto_advance(room)
    elif result:
        await broadcast_room_state(room)


async def end_game_session(room):
    """结束整场对局，记录统计到数据库"""
    room.end_game_session()
    rm.cleanup_timer(room.room_id)

    duration = int(room.game_duration)
    for p in room.players:
        # 从 room_manager 中查找玩家的手机号
        info = rm.get_player(p.sid)
        phone = info['phone'] if info else ''
        record_game_result(
            room_id=room.room_id,
            phone=phone,
            profit=p.get_profit(),
            hands_played=p.hands_played,
            hands_won=p.hands_won,
            borrowed=p.total_borrowed,
            duration=duration,
        )
    await broadcast_room_state(room)


async def room_timer(room_id: str):
    """房间倒计时协程"""
    room = rm.get_room(room_id)
    if not room:
        return

    remaining = room.get_remaining_time()
    while remaining > 0:
        await asyncio.sleep(min(remaining, 30))
        if room_id not in rm.rooms:
            return
        room = rm.rooms[room_id]
        if not room.is_game_active:
            return
        remaining = room.get_remaining_time()
        await broadcast_room_state(room)

    # 时间到
    if room_id in rm.rooms:
        room = rm.rooms[room_id]
        if room.is_game_active:
            if room.game_state in ('preflop', 'flop', 'turn', 'river'):
                room.is_game_active = False
                await broadcast_room_state(room)
            else:
                await end_game_session(room)
