"""
德州扑克手牌评估器
支持 5-7 张牌中选最优 5 张组合评估。
"""
from itertools import combinations
from collections import Counter

HAND_RANKINGS = {
    9: '皇家同花顺',
    8: '同花顺',
    7: '四条',
    6: '葫芦',
    5: '同花',
    4: '顺子',
    3: '三条',
    2: '两对',
    1: '一对',
    0: '高牌',
}


def _evaluate_five(cards) -> tuple:
    """
    评估恰好 5 张牌的手牌强度。
    返回可比较的元组 (牌型等级, 踢脚牌...)。
    """
    ranks = sorted([c.rank for c in cards], reverse=True)
    suits = [c.suit for c in cards]

    is_flush = len(set(suits)) == 1

    # 检查顺子
    unique = sorted(set(ranks), reverse=True)
    is_straight = False
    straight_high = 0

    if len(unique) == 5:
        if unique[0] - unique[4] == 4:
            is_straight = True
            straight_high = unique[0]
        elif unique == [14, 5, 4, 3, 2]:  # A-2-3-4-5
            is_straight = True
            straight_high = 5

    rank_counts = Counter(ranks)
    groups = sorted(rank_counts.items(), key=lambda x: (x[1], x[0]), reverse=True)
    counts = sorted(rank_counts.values(), reverse=True)

    # 皇家同花顺 / 同花顺
    if is_straight and is_flush:
        return (9,) if straight_high == 14 else (8, straight_high)
    # 四条
    if counts == [4, 1]:
        return (7, groups[0][0], groups[1][0])
    # 葫芦
    if counts == [3, 2]:
        return (6, groups[0][0], groups[1][0])
    # 同花
    if is_flush:
        return (5,) + tuple(ranks)
    # 顺子
    if is_straight:
        return (4, straight_high)
    # 三条
    if counts == [3, 1, 1]:
        kickers = sorted([g[0] for g in groups if g[1] == 1], reverse=True)
        return (3, groups[0][0]) + tuple(kickers)
    # 两对
    if counts == [2, 2, 1]:
        pairs = sorted([g[0] for g in groups if g[1] == 2], reverse=True)
        kicker = [g[0] for g in groups if g[1] == 1][0]
        return (2,) + tuple(pairs) + (kicker,)
    # 一对
    if counts == [2, 1, 1, 1]:
        pair_rank = groups[0][0]
        kickers = sorted([g[0] for g in groups if g[1] == 1], reverse=True)
        return (1, pair_rank) + tuple(kickers)
    # 高牌
    return (0,) + tuple(ranks)


def evaluate_hand(cards) -> tuple:
    """从 5-7 张牌中评估最佳的 5 张手牌组合。"""
    if len(cards) <= 5:
        return _evaluate_five(cards)
    return max((_evaluate_five(list(c)) for c in combinations(cards, 5)))


def get_hand_name(score) -> str:
    """获取手牌的中文名称。"""
    if score:
        return HAND_RANKINGS.get(score[0], '未知')
    return '未知'
