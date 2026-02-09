"""
扑克牌与牌组
"""
import random

SUITS = ('spade', 'heart', 'diamond', 'club')
SUIT_SYMBOLS = {'spade': '♠', 'heart': '♥', 'diamond': '♦', 'club': '♣'}
RANK_NAMES = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8',
    9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}


class Card:
    """一张扑克牌"""

    __slots__ = ('suit', 'rank')

    def __init__(self, suit: str, rank: int):
        self.suit = suit    # 'spade' | 'heart' | 'diamond' | 'club'
        self.rank = rank    # 2-14 (14=A)

    def to_dict(self):
        return {'suit': self.suit, 'rank': RANK_NAMES[self.rank], 'value': self.rank}

    def __repr__(self):
        return f"{SUIT_SYMBOLS.get(self.suit, '?')}{RANK_NAMES.get(self.rank, '?')}"


class Deck:
    """标准52张扑克牌组"""

    def __init__(self):
        self.cards = []
        self.reset()

    def reset(self):
        """重新洗牌"""
        self.cards = [Card(s, r) for s in SUITS for r in range(2, 15)]
        random.shuffle(self.cards)

    def deal(self, n=1):
        """发 n 张牌"""
        dealt = self.cards[:n]
        self.cards = self.cards[n:]
        return dealt
