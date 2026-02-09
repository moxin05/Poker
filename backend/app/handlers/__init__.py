"""
Socket.IO 事件处理器
在此文件中注册所有处理器模块。
"""


def register_all_handlers():
    """导入所有 handler 模块，触发 @sio.event 装饰器注册"""
    import app.handlers.connection   # noqa: F401
    import app.handlers.auth         # noqa: F401
    import app.handlers.room         # noqa: F401
    import app.handlers.game         # noqa: F401
    import app.handlers.stats        # noqa: F401
