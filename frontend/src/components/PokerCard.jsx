import { getCardFront, CARD_BACK, SUIT_SYMBOLS, RANK_LABELS } from "../shared/cards.js";
import "./PokerCard.css";

/**
 * 扑克牌组件
 *
 * @param {string}  suit       - 花色: heart | spade | diamond | club
 * @param {number}  rank       - 点数: 1-13
 * @param {boolean} faceDown   - 是否背面朝上 (默认 false)
 * @param {boolean} selected   - 是否被选中
 * @param {boolean} disabled   - 是否禁用点击
 * @param {string}  size       - 尺寸: "sm" | "md" | "lg" (默认 "md")
 * @param {function} onClick   - 点击回调
 */
export default function PokerCard({
  suit,
  rank,
  faceDown = false,
  selected = false,
  disabled = false,
  size = "md",
  onClick,
}) {
  const symbol = SUIT_SYMBOLS[suit];
  const label = RANK_LABELS[rank];

  return (
    <div
      className={[
        "pokerCard",
        `pokerCard--${size}`,
        faceDown && "pokerCard--faceDown",
        selected && "pokerCard--selected",
        disabled && "pokerCard--disabled",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={disabled ? undefined : onClick}
    >
      <div className="pokerCard__inner">
        {/* 正面 */}
        <div className="pokerCard__front">
          <img
            className="pokerCard__img"
            src={getCardFront(suit, rank)}
            alt={`${symbol}${label}`}
            draggable={false}
          />
          {/* 盾形数字角标 */}
          <div className="pokerCard__badge">{label}</div>
        </div>

        {/* 背面 */}
        <div className="pokerCard__back">
          <img
            className="pokerCard__img"
            src={CARD_BACK}
            alt="牌背"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
