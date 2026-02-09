"""
玩家模型
"""
from app.config import INITIAL_CHIPS, BORROW_AMOUNT


class Player:
    """房间内的一个玩家"""

    def __init__(self, sid: str, username: str):
        self.sid = sid
        self.username = username
        self.chips = INITIAL_CHIPS
        self.hole_cards = []
        self.current_bet = 0
        self.total_bet = 0
        self.is_folded = False
        self.is_all_in = False

        # 对局内统计
        self.initial_chips = INITIAL_CHIPS
        self.total_borrowed = 0
        self.hands_played = 0
        self.hands_won = 0

    def reset_for_new_hand(self):
        """为新一手牌重置临时状态"""
        self.hole_cards = []
        self.current_bet = 0
        self.total_bet = 0
        self.is_folded = False
        self.is_all_in = False

    def borrow_chips(self) -> int:
        """向系统赊账，返回赊账金额"""
        self.chips += BORROW_AMOUNT
        self.total_borrowed += BORROW_AMOUNT
        return BORROW_AMOUNT

    def get_profit(self) -> int:
        """计算净盈亏 = 当前筹码 - 初始筹码 - 累计赊账"""
        return self.chips - self.initial_chips - self.total_borrowed

    def to_dict(self, show_cards: bool = False) -> dict:
        """序列化为前端可用的字典"""
        return {
            'sid': self.sid,
            'username': self.username,
            'chips': self.chips,
            'current_bet': self.current_bet,
            'total_bet': self.total_bet,
            'is_folded': self.is_folded,
            'is_all_in': self.is_all_in,
            'hole_cards': [c.to_dict() for c in self.hole_cards] if show_cards else [],
            'card_count': len(self.hole_cards),
            'profit': self.get_profit(),
            'total_borrowed': self.total_borrowed,
            'hands_played': self.hands_played,
            'hands_won': self.hands_won,
        }
