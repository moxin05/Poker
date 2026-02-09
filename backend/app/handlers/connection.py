"""
连接 / 断开事件
"""
from app.server import sio
from app.services import room_manager as rm
from app.services.game_flow import broadcast_room_state, end_game_session


@sio.event
async def connect(sid, environ):
    print(f'[连接] {sid}')


@sio.event
async def disconnect(sid):
    print(f'[断开] {sid}')
    info = rm.get_player(sid)
    if not info:
        return

    room_id = info.get('room_id')
    if room_id and room_id in rm.rooms:
        room = rm.rooms[room_id]
        player = room.get_player_by_sid(sid)

        # 游戏中离开视为弃牌
        if player and room.game_state not in ('waiting', 'showdown', 'finished'):
            player.is_folded = True
            pidx = room.get_player_idx(sid)
            if room.current_player_idx == pidx:
                active = room.active_players()
                if len(active) == 1:
                    room.determine_winners()
                else:
                    next_idx = room.next_player_idx(pidx)
                    if next_idx != -1:
                        room.current_player_idx = next_idx
                        room.needs_to_act.discard(pidx)
                    if len(room.needs_to_act) == 0:
                        room.advance_round()

        room.remove_player(sid)
        await sio.leave_room(sid, room_id)

        if not room.players:
            rm.cleanup_room(room_id)
            print(f'[房间] {room_id} 已关闭（无玩家）')
        elif len(room.players) < 2 and room.is_game_active:
            await end_game_session(room)
        else:
            await broadcast_room_state(room)

    rm.players.pop(sid, None)
