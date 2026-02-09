"""
游戏房间 - 管理一场对局的完整生命周期
"""
import random
import string
import time

from app.config import (
    INITIAL_CHIPS, MAX_PLAYERS_PER_ROOM,
    SMALL_BLIND, BIG_BLIND, ROOM_ID_LENGTH,
)
from app.game.card import Deck
from app.game.evaluator import evaluate_hand, get_hand_name


def generate_room_id() -> str:
    """生成随机数字房间号"""
    return ''.join(random.choices(string.digits, k=ROOM_ID_LENGTH))


class Room:
    """一个游戏房间"""

    def __init__(self, room_id: str, host_sid: str):
        self.room_id = room_id
        self.host_sid = host_sid
        self.players = []

        # 牌桌状态
        self.game_state = 'waiting'  # waiting|preflop|flop|turn|river|showdown|finished
        self.deck = None
        self.community_cards = []
        self.pot = 0
        self.current_player_idx = -1
        self.dealer_idx = 0
        self.small_blind = SMALL_BLIND
        self.big_blind = BIG_BLIND
        self.current_bet = 0
        self.needs_to_act = set()
        self.min_raise = 0
        self.last_raise_size = 0

        # 手牌结果
        self.winners = []
        self.hand_result = None
        self.hand_number = 0

        # 倒计时
        self.game_duration = 600
        self.game_start_time = 0
        self.game_end_time = 0
        self.is_game_active = False
        self.auto_next = True

    # ───────── 房间管理 ─────────

    def add_player(self, player) -> bool:
        if len(self.players) >= MAX_PLAYERS_PER_ROOM:
            return False
        self.players.append(player)
        return True

    def remove_player(self, sid: str):
        self.players = [p for p in self.players if p.sid != sid]
        if self.host_sid == sid and self.players:
            self.host_sid = self.players[0].sid
        if self.players and self.dealer_idx >= len(self.players):
            self.dealer_idx = 0

    def get_player_by_sid(self, sid: str):
        return next((p for p in self.players if p.sid == sid), None)

    def get_player_idx(self, sid: str) -> int:
        for i, p in enumerate(self.players):
            if p.sid == sid:
                return i
        return -1

    # ───────── 倒计时 ─────────

    def start_game_session(self, duration_minutes: int = 10):
        self.game_duration = duration_minutes * 60
        self.game_start_time = time.time()
        self.game_end_time = self.game_start_time + self.game_duration
        self.is_game_active = True
        for p in self.players:
            p.initial_chips = INITIAL_CHIPS
            p.chips = INITIAL_CHIPS
            p.total_borrowed = 0
            p.hands_played = 0
            p.hands_won = 0
        return self.start_hand()

    def get_remaining_time(self) -> int:
        if not self.is_game_active:
            return 0
        return max(0, int(self.game_end_time - time.time()))

    def is_time_up(self) -> bool:
        return self.is_game_active and time.time() >= self.game_end_time

    def end_game_session(self):
        self.is_game_active = False
        self.game_state = 'finished'
        return self.get_final_results()

    def get_final_results(self):
        results = [{
            'sid': p.sid,
            'username': p.username,
            'chips': p.chips,
            'profit': p.get_profit(),
            'total_borrowed': p.total_borrowed,
            'hands_played': p.hands_played,
            'hands_won': p.hands_won,
            'win_rate': round(p.hands_won / p.hands_played * 100, 1) if p.hands_played > 0 else 0,
        } for p in self.players]
        results.sort(key=lambda x: x['profit'], reverse=True)
        return results

    # ───────── 辅助查询 ─────────

    def active_players(self):
        return [p for p in self.players if not p.is_folded]

    def active_players_with_chips(self):
        return [p for p in self.players if not p.is_folded and not p.is_all_in]

    def next_player_idx(self, from_idx, skip_folded=True, skip_all_in=True) -> int:
        n = len(self.players)
        for i in range(1, n + 1):
            idx = (from_idx + i) % n
            p = self.players[idx]
            if skip_folded and p.is_folded:
                continue
            if skip_all_in and p.is_all_in:
                continue
            if p.chips <= 0 and skip_all_in:
                continue
            return idx
        return -1

    # ───────── 游戏流程 ─────────

    def start_hand(self):
        if len(self.players) < 2:
            return False

        # 自动赊账
        for p in self.players:
            if p.chips < self.big_blind:
                p.borrow_chips()

        for p in self.players:
            p.reset_for_new_hand()
            p.hands_played += 1

        self.community_cards = []
        self.pot = 0
        self.current_bet = 0
        self.needs_to_act = set()
        self.winners = []
        self.hand_result = None
        self.hand_number += 1

        self.deck = Deck()
        for p in self.players:
            p.hole_cards = self.deck.deal(2)

        n = len(self.players)
        if n == 2:
            sb_idx = self.dealer_idx
            bb_idx = self.next_player_idx(self.dealer_idx, skip_all_in=False, skip_folded=False)
        else:
            sb_idx = self.next_player_idx(self.dealer_idx, skip_all_in=False, skip_folded=False)
            bb_idx = self.next_player_idx(sb_idx, skip_all_in=False, skip_folded=False)

        # 小盲
        sb = self.players[sb_idx]
        sb_amt = min(self.small_blind, sb.chips)
        sb.chips -= sb_amt
        sb.current_bet = sb_amt
        sb.total_bet = sb_amt
        self.pot += sb_amt
        if sb.chips == 0:
            sb.is_all_in = True

        # 大盲
        bb = self.players[bb_idx]
        bb_amt = min(self.big_blind, bb.chips)
        bb.chips -= bb_amt
        bb.current_bet = bb_amt
        bb.total_bet = bb_amt
        self.pot += bb_amt
        if bb.chips == 0:
            bb.is_all_in = True

        self.current_bet = self.big_blind
        self.min_raise = self.big_blind * 2
        self.last_raise_size = self.big_blind

        for i, p in enumerate(self.players):
            if not p.is_folded and not p.is_all_in and p.chips > 0:
                self.needs_to_act.add(i)

        if n == 2:
            self.current_player_idx = sb_idx if not self.players[sb_idx].is_all_in else bb_idx
        else:
            first = self.next_player_idx(bb_idx)
            self.current_player_idx = first if first != -1 else sb_idx

        self.game_state = 'preflop'
        return 'auto_advance' if len(self.needs_to_act) <= 1 else True

    def process_action(self, sid, action, amount=0):
        player_idx = self.get_player_idx(sid)
        if player_idx == -1 or player_idx != self.current_player_idx:
            return None

        player = self.players[player_idx]
        if player.is_folded or player.is_all_in:
            return None

        if action == 'fold':
            player.is_folded = True
            self.needs_to_act.discard(player_idx)

        elif action == 'check':
            if player.current_bet < self.current_bet:
                return None
            self.needs_to_act.discard(player_idx)

        elif action == 'call':
            call_amt = min(self.current_bet - player.current_bet, player.chips)
            player.chips -= call_amt
            player.current_bet += call_amt
            player.total_bet += call_amt
            self.pot += call_amt
            if player.chips == 0:
                player.is_all_in = True
            self.needs_to_act.discard(player_idx)

        elif action == 'raise':
            raise_to = int(amount)
            if raise_to < self.min_raise and raise_to < player.current_bet + player.chips:
                return None
            additional = min(raise_to - player.current_bet, player.chips)
            player.chips -= additional
            player.current_bet += additional
            player.total_bet += additional
            self.pot += additional
            raise_size = player.current_bet - self.current_bet
            self.current_bet = player.current_bet
            self.last_raise_size = raise_size
            self.min_raise = self.current_bet + max(raise_size, self.big_blind)
            if player.chips == 0:
                player.is_all_in = True
            self.needs_to_act.discard(player_idx)
            for i, p in enumerate(self.players):
                if i != player_idx and not p.is_folded and not p.is_all_in and p.chips > 0:
                    self.needs_to_act.add(i)

        elif action == 'allin':
            allin_amt = player.chips
            player.current_bet += allin_amt
            player.total_bet += allin_amt
            player.chips = 0
            self.pot += allin_amt
            player.is_all_in = True
            if player.current_bet > self.current_bet:
                raise_size = player.current_bet - self.current_bet
                self.current_bet = player.current_bet
                self.last_raise_size = raise_size
                self.min_raise = self.current_bet + max(raise_size, self.big_blind)
                for i, p in enumerate(self.players):
                    if i != player_idx and not p.is_folded and not p.is_all_in and p.chips > 0:
                        self.needs_to_act.add(i)
            self.needs_to_act.discard(player_idx)
        else:
            return None

        active = self.active_players()
        if len(active) == 1:
            self.determine_winners()
            return 'hand_over'
        if len(self.needs_to_act) == 0:
            return 'round_complete'
        next_idx = self.next_player_idx(player_idx)
        if next_idx == -1:
            return 'round_complete'
        self.current_player_idx = next_idx
        return 'continue'

    def advance_round(self):
        for p in self.players:
            p.current_bet = 0
        self.current_bet = 0
        self.last_raise_size = self.big_blind
        self.min_raise = self.big_blind

        active_with_chips = self.active_players_with_chips()

        if self.game_state == 'preflop':
            self.community_cards.extend(self.deck.deal(3))
            self.game_state = 'flop'
        elif self.game_state == 'flop':
            self.community_cards.extend(self.deck.deal(1))
            self.game_state = 'turn'
        elif self.game_state == 'turn':
            self.community_cards.extend(self.deck.deal(1))
            self.game_state = 'river'
        elif self.game_state == 'river':
            self.determine_winners()
            return

        if len(active_with_chips) <= 1:
            while len(self.community_cards) < 5:
                self.community_cards.extend(self.deck.deal(1))
            self.determine_winners()
            return

        self.needs_to_act = {
            i for i, p in enumerate(self.players)
            if not p.is_folded and not p.is_all_in and p.chips > 0
        }
        first = self.next_player_idx(self.dealer_idx)
        if first == -1:
            self.determine_winners()
            return
        self.current_player_idx = first

    def determine_winners(self):
        self.game_state = 'showdown'
        active = self.active_players()

        if len(active) == 1:
            w = active[0]
            w.chips += self.pot
            w.hands_won += 1
            self.winners = [{'sid': w.sid, 'username': w.username, 'amount': self.pot,
                             'hand_name': '', 'cards': [c.to_dict() for c in w.hole_cards]}]
            self.hand_result = f"{w.username} 赢得 {self.pot} 筹码（其他人弃牌）"
            self.pot = 0
            return

        scores = {p.sid: evaluate_hand(p.hole_cards + self.community_cards) for p in active}
        sorted_active = sorted(active, key=lambda p: p.total_bet)

        total_awarded = {}
        processed = 0

        for i, cand in enumerate(sorted_active):
            level = cand.total_bet
            if level <= processed:
                continue
            layer = sum(
                min(p.total_bet, level) - min(p.total_bet, processed)
                for p in self.players
            )
            eligible = [p for p in sorted_active[i:] if scores.get(p.sid)]
            if not eligible:
                continue
            best = max(scores[p.sid] for p in eligible)
            layer_winners = [p for p in eligible if scores[p.sid] == best]
            share, rem = divmod(layer, len(layer_winners))
            for j, w in enumerate(layer_winners):
                total_awarded[w.sid] = total_awarded.get(w.sid, 0) + share + (1 if j < rem else 0)
            processed = level

        self.winners = []
        for p in active:
            award = total_awarded.get(p.sid, 0)
            if award > 0:
                p.chips += award
                p.hands_won += 1
                self.winners.append({
                    'sid': p.sid, 'username': p.username, 'amount': award,
                    'hand_name': get_hand_name(scores.get(p.sid)),
                    'cards': [c.to_dict() for c in p.hole_cards],
                })

        if len(self.winners) == 1:
            w = self.winners[0]
            self.hand_result = f"{w['username']} 以 {w['hand_name']} 赢得 {w['amount']} 筹码"
        elif self.winners:
            names = ', '.join(w['username'] for w in self.winners)
            self.hand_result = f"{names} 平分 {sum(w['amount'] for w in self.winners)} 筹码"
        else:
            self.hand_result = "无赢家"
        self.pot = 0

    def next_hand(self):
        if self.is_time_up():
            return 'time_up'
        if len(self.players) < 2:
            return 'not_enough_players'
        nd = self.next_player_idx(self.dealer_idx, skip_all_in=False, skip_folded=False)
        if nd != -1:
            self.dealer_idx = nd
        return self.start_hand()

    # ───────── 状态输出 ─────────

    def get_available_actions(self, sid):
        player = self.get_player_by_sid(sid)
        if not player or player.is_folded or player.is_all_in:
            return []
        actions = ['fold']
        actions.append('check' if player.current_bet >= self.current_bet else 'call')
        if player.chips > self.current_bet - player.current_bet:
            actions.append('raise')
        actions.append('allin')
        return actions

    def get_call_amount(self, sid) -> int:
        player = self.get_player_by_sid(sid)
        if not player:
            return 0
        return min(self.current_bet - player.current_bet, player.chips)

    def get_state_for_player(self, sid) -> dict:
        player_data = []
        for p in self.players:
            show = (p.sid == sid) or (self.game_state == 'showdown' and not p.is_folded)
            player_data.append(p.to_dict(show_cards=show))

        cur_sid = None
        if 0 <= self.current_player_idx < len(self.players):
            cur_sid = self.players[self.current_player_idx].sid

        return {
            'room_id': self.room_id,
            'host_sid': self.host_sid,
            'game_state': self.game_state,
            'players': player_data,
            'community_cards': [c.to_dict() for c in self.community_cards],
            'pot': self.pot,
            'current_bet': self.current_bet,
            'current_player_sid': cur_sid,
            'dealer_idx': self.dealer_idx,
            'my_index': self.get_player_idx(sid),
            'available_actions': self.get_available_actions(sid) if cur_sid == sid else [],
            'call_amount': self.get_call_amount(sid),
            'min_raise': self.min_raise,
            'winners': self.winners,
            'hand_result': self.hand_result,
            'hand_number': self.hand_number,
            'small_blind': self.small_blind,
            'big_blind': self.big_blind,
            'remaining_time': self.get_remaining_time(),
            'is_game_active': self.is_game_active,
            'game_duration': self.game_duration,
            'final_results': self.get_final_results() if self.game_state == 'finished' else None,
        }
