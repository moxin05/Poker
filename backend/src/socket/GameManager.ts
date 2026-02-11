import type { Server } from "socket.io";
import { Deck, type Card } from "./Deck";

type Phase = "preflop" | "flop" | "turn" | "river" | "showdown" | "ended";

interface PlayerState {
  userId: string;
  phone: string;
  seatIndex: number;
  chips: number;
  hand: Card[];
  currentBet: number;  // 本轮已下注
  totalBet: number;    // 本局总下注
  folded: boolean;
  allIn: boolean;
  acted: boolean;      // 本轮是否已行动
}

interface GameConfig {
  smallBlind: number;
  bigBlind: number;
}

export class GameManager {
  private roomId: string;
  private players: PlayerState[];
  private deck: Deck;
  private community: Card[] = [];
  private pot = 0;
  private phase: Phase = "preflop";
  private currentTurnIdx = 0;     // 当前行动玩家在 players 数组中的索引
  private dealerIdx = 0;
  private config: GameConfig;
  private highestBet = 0;         // 当前轮次最高下注

  constructor(roomId: string, roomPlayers: any[], config: GameConfig) {
    this.roomId = roomId;
    this.config = config;
    this.deck = new Deck();

    // 按 seatIndex 排序
    this.players = roomPlayers
      .map((p: any) => ({
        userId: p.userId.toString(),
        phone: p.phone,
        seatIndex: p.seatIndex,
        chips: p.chips,
        hand: [],
        currentBet: 0,
        totalBet: 0,
        folded: false,
        allIn: false,
        acted: false,
      }))
      .sort((a, b) => a.seatIndex - b.seatIndex);
  }

  isActive(): boolean {
    return this.phase !== "ended";
  }

  /* ========================================
     开始一轮
     ======================================== */
  startRound(io: Server) {
    this.deck = new Deck();
    this.community = [];
    this.pot = 0;
    this.phase = "preflop";
    this.highestBet = 0;

    // 重置所有玩家状态
    for (const p of this.players) {
      p.hand = [];
      p.currentBet = 0;
      p.totalBet = 0;
      p.folded = false;
      p.allIn = false;
      p.acted = false;
    }

    const n = this.players.length;

    // 庄家、小盲、大盲
    const sbIdx = (this.dealerIdx + 1) % n;
    const bbIdx = (this.dealerIdx + 2) % n;

    // 下盲注
    this.placeBet(sbIdx, this.config.smallBlind);
    this.placeBet(bbIdx, this.config.bigBlind);
    this.highestBet = this.config.bigBlind;

    // 小盲大盲不算已行动（他们还能加注）
    this.players[sbIdx].acted = false;
    this.players[bbIdx].acted = false;

    // 发手牌
    for (const p of this.players) {
      p.hand = this.deck.deal(2);
    }

    // 通知游戏开始
    io.to(this.roomId).emit("game:started", {
      dealerSeatIndex: this.players[this.dealerIdx].seatIndex,
      smallBlindSeatIndex: this.players[sbIdx].seatIndex,
      bigBlindSeatIndex: this.players[bbIdx].seatIndex,
      players: this.players.map((p) => ({
        id: p.userId,
        seatIndex: p.seatIndex,
        chips: p.chips,
      })),
    });

    // 单独给每个玩家发他们的手牌
    for (const p of this.players) {
      const sockets = io.sockets.adapter.rooms.get(this.roomId);
      if (sockets) {
        for (const sid of sockets) {
          const s = io.sockets.sockets.get(sid);
          if (s && s.data.userId === p.userId) {
            s.emit("game:deal", { hand: p.hand });
          }
        }
      }
    }

    // 第一个行动的人是大盲后面
    this.currentTurnIdx = (bbIdx + 1) % n;
    this.skipFoldedAndAllIn();
    this.emitTurn(io);
  }

  /* ========================================
     处理玩家操作
     ======================================== */
  handleAction(userId: string, action: string, amount?: number) {
    const pIdx = this.players.findIndex((p) => p.userId === userId);
    if (pIdx === -1) return { error: "你不在这局游戏中" };
    if (pIdx !== this.currentTurnIdx) return { error: "还没轮到你" };

    const player = this.players[pIdx];
    if (player.folded || player.allIn) return { error: "你已弃牌或全下" };

    const callAmount = this.highestBet - player.currentBet;
    let broadcast: any = { playerId: userId, seatIndex: player.seatIndex, action };

    switch (action) {
      case "check":
        if (callAmount > 0) return { error: "有人下注了，不能过牌" };
        break;

      case "call":
        if (callAmount <= 0) return { error: "没有需要跟的注" };
        this.placeBet(pIdx, Math.min(callAmount, player.chips));
        broadcast.amount = Math.min(callAmount, player.chips);
        break;

      case "fold":
        player.folded = true;
        break;

      case "raise": {
        const raiseAmt = amount ?? 0;
        const totalNeeded = callAmount + raiseAmt;
        if (raiseAmt < this.config.bigBlind && raiseAmt < player.chips) {
          return { error: `加注最少 ${this.config.bigBlind}` };
        }
        const actual = Math.min(totalNeeded, player.chips);
        this.placeBet(pIdx, actual);
        this.highestBet = player.currentBet;
        // 其他人需要重新行动
        for (const op of this.players) {
          if (op.userId !== userId && !op.folded && !op.allIn) {
            op.acted = false;
          }
        }
        broadcast.amount = actual;
        break;
      }

      case "allin": {
        const allInAmount = player.chips;
        this.placeBet(pIdx, allInAmount);
        if (player.currentBet > this.highestBet) {
          this.highestBet = player.currentBet;
          for (const op of this.players) {
            if (op.userId !== userId && !op.folded && !op.allIn) {
              op.acted = false;
            }
          }
        }
        broadcast.amount = allInAmount;
        break;
      }

      default:
        return { error: "未知操作" };
    }

    player.acted = true;
    broadcast.playerChips = player.chips;
    broadcast.pot = this.pot;

    // 检查是否只剩一个人
    const activePlayers = this.players.filter((p) => !p.folded);
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.chips += this.pot;
      return {
        broadcast,
        roundEnd: {
          winners: [{ playerId: winner.userId, seatIndex: winner.seatIndex, amount: this.pot }],
          players: this.players.map((p) => ({ id: p.userId, seatIndex: p.seatIndex, chips: p.chips })),
          reason: "其他玩家全部弃牌",
        },
      };
    }

    // 检查是否本轮所有人都行动了
    const needAction = this.players.some(
      (p) => !p.folded && !p.allIn && !p.acted
    );

    if (needAction) {
      // 下一个玩家
      this.currentTurnIdx = (this.currentTurnIdx + 1) % this.players.length;
      this.skipFoldedAndAllIn();
      return { broadcast, nextPhase: false };
    }

    // 本轮结束，进入下一阶段
    return { broadcast, nextPhase: true };
  }

  /* ========================================
     推进阶段
     ======================================== */
  advancePhase(io: Server) {
    // 重置本轮下注
    for (const p of this.players) {
      p.currentBet = 0;
      p.acted = false;
    }
    this.highestBet = 0;

    const phases: Phase[] = ["preflop", "flop", "turn", "river", "showdown"];
    const nextIdx = phases.indexOf(this.phase) + 1;
    this.phase = phases[nextIdx] || "showdown";

    let newCards: Card[] = [];
    switch (this.phase) {
      case "flop":
        newCards = this.deck.deal(3);
        this.community.push(...newCards);
        break;
      case "turn":
      case "river":
        newCards = this.deck.deal(1);
        this.community.push(...newCards);
        break;
      case "showdown":
        this.doShowdown(io);
        return;
    }

    // 广播公共牌
    io.to(this.roomId).emit("game:community", {
      phase: this.phase,
      cards: newCards,
      allCommunity: this.community,
    });

    // 检查是否所有人都 all-in 或只剩1个能行动的
    const canAct = this.players.filter((p) => !p.folded && !p.allIn);
    if (canAct.length <= 1) {
      // 自动推进到下一阶段
      setTimeout(() => this.advancePhase(io), 1000);
      return;
    }

    // 庄家后第一个未弃牌的人先行动
    this.currentTurnIdx = (this.dealerIdx + 1) % this.players.length;
    this.skipFoldedAndAllIn();
    this.emitTurn(io);
  }

  /* ========================================
     摊牌结算（简化版：暂时随机选赢家，后续加牌力判定）
     ======================================== */
  private doShowdown(io: Server) {
    this.phase = "ended";

    const activePlayers = this.players.filter((p) => !p.folded);

    // TODO: 实现牌力比较，暂时随机
    const winnerIdx = Math.floor(Math.random() * activePlayers.length);
    const winner = activePlayers[winnerIdx];
    winner.chips += this.pot;

    // 广播所有玩家手牌
    const hands: any[] = activePlayers.map((p) => ({
      playerId: p.userId,
      seatIndex: p.seatIndex,
      hand: p.hand,
    }));

    io.to(this.roomId).emit("game:showdown", { hands, community: this.community });

    io.to(this.roomId).emit("game:round_end", {
      winners: [{ playerId: winner.userId, seatIndex: winner.seatIndex, amount: this.pot }],
      players: this.players.map((p) => ({ id: p.userId, seatIndex: p.seatIndex, chips: p.chips })),
      reason: "摊牌",
    });
  }

  /* ========================================
     辅助方法
     ======================================== */
  private placeBet(pIdx: number, amount: number) {
    const p = this.players[pIdx];
    const actual = Math.min(amount, p.chips);
    p.chips -= actual;
    p.currentBet += actual;
    p.totalBet += actual;
    this.pot += actual;
    if (p.chips === 0) p.allIn = true;
  }

  private skipFoldedAndAllIn() {
    const n = this.players.length;
    for (let i = 0; i < n; i++) {
      const p = this.players[this.currentTurnIdx];
      if (!p.folded && !p.allIn && !p.acted) break;
      this.currentTurnIdx = (this.currentTurnIdx + 1) % n;
    }
  }

  private emitTurn(io: Server) {
    const p = this.players[this.currentTurnIdx];
    const callAmount = this.highestBet - p.currentBet;

    io.to(this.roomId).emit("game:turn", {
      playerId: p.userId,
      seatIndex: p.seatIndex,
      currentBet: callAmount,
      minRaise: this.config.bigBlind,
      maxRaise: p.chips,
      pot: this.pot,
      canCheck: callAmount === 0,
    });
  }
}
