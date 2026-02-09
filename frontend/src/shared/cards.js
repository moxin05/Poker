/**
 * 扑克牌常量定义
 *
 * 花色: heart(红桃) spade(黑桃) diamond(方块) club(梅花)
 * 点数: 1=A, 2-10, 11=J, 12=Q, 13=K
 */

export const SUITS = ["heart", "spade", "diamond", "club"];

export const SUIT_LABELS = {
  heart: "红桃",
  spade: "黑桃",
  diamond: "方块",
  club: "梅花",
};

export const SUIT_SYMBOLS = {
  heart: "♥",
  spade: "♠",
  diamond: "♦",
  club: "♣",
};

export const RANK_LABELS = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};

/** 卡牌正面图片路径 */
export function getCardFront(suit, rank) {
  return `/card/${suit}_${rank}.png`;
}

/** 卡牌背面图片路径 */
export const CARD_BACK = "/asset/fold.png";

/** 生成完整一副牌 (52张) */
export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ suit, rank, id: `${suit}_${rank}` });
    }
  }
  return deck;
}

/** 获取卡牌显示名称，例如 "红桃A" "黑桃10" */
export function getCardName(suit, rank) {
  return `${SUIT_LABELS[suit]}${RANK_LABELS[rank]}`;
}
