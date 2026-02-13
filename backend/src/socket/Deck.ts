export type Card = {
  suit: "heart" | "spade" | "diamond" | "club";
  rank: number; // 1=A, 2-10, 11=J, 12=Q, 13=K
};

const SUITS: Card["suit"][] = ["heart", "spade", "diamond", "club"];

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        this.cards.push({ suit, rank });
      }
    }
    this.shuffle();
  }

  private shuffle() {
    // Fisher-Yates
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(count: number): Card[] {
    return this.cards.splice(0, count);
  }
}
