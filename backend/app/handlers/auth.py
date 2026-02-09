"""
认证事件: 手机号注册 / 登录
"""
from app.server import sio
from app.db import register_user, authenticate_user, get_user_stats
from app.services import room_manager as rm


@sio.event
async def auth_register(sid, data):
    phone = data.get('phone', '').strip()
    nickname = data.get('nickname', '').strip()
    password = data.get('password', '')

    success, message = register_user(phone, nickname, password)
    event = 'register_success' if success else 'register_fail'
    await sio.emit(event, {'message': message}, room=sid)
    if success:
        print(f'[注册] {nickname}({phone}) ({sid})')


@sio.event
async def auth_login(sid, data):
    phone = data.get('phone', '').strip()
    password = data.get('password', '')

    success, message, nickname = authenticate_user(phone, password)
    if success:
        rm.players[sid] = {'phone': phone, 'nickname': nickname, 'room_id': None}
        await sio.emit('login_success', {
            'sid': sid, 'phone': phone, 'nickname': nickname,
            'stats': get_user_stats(phone),
        }, room=sid)
        print(f'[登录] {nickname}({phone}) ({sid})')
    else:
        await sio.emit('login_fail', {'message': message}, room=sid)
