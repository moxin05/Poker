import { useState } from "react";
import PokerCard from "../../../components/PokerCard.jsx";

const SEAT_COUNT = 8;

// 8 个座位 — 圆心对准牌桌金色边框线
// 边框线位于: 距容器边缘 ≈ 18px (frame border 2px + padding 16px)
// 容器尺寸 720×419 → 上下 ≈ 4.3%, 左右 ≈ 2.5%
const SEAT_POSITIONS = [
  { left: "25%",   top: "4%" },    // 0: 上-左
  { left: "50%",   top: "4%" },    // 1: 上-中
  { left: "75%",   top: "4%" },    // 2: 上-右
  { left: "97.5%", top: "50%" },   // 3: 右
  { left: "75%",   top: "96%" },   // 4: 下-右
  { left: "50%",   top: "96%" },   // 5: 下-中
  { left: "25%",   top: "96%" },   // 6: 下-左
  { left: "2.5%",  top: "50%" },   // 7: 左
];

/* ------------------------------------------------
   内联 SVG 装饰组件
   ------------------------------------------------ */

// 中心纹章 — 仿七圣召唤罗盘
function Emblem() {
  const c = "rgba(125, 168, 152, 0.28)";
  const cL = "rgba(125, 168, 152, 0.18)";

  return (
    <svg viewBox="0 0 200 200" className="ptEmblem__svg">
      {/* 外圈 */}
      <circle cx="100" cy="100" r="88" fill="none" stroke={c} strokeWidth="1.4" />

      {/* 4 主轴射线 */}
      {[0, 90, 180, 270].map((a) => (
        <rect
          key={a} x="95" y="12" width="10" height="58" rx="2.5"
          fill={cL} transform={`rotate(${a} 100 100)`}
        />
      ))}

      {/* 4 斜轴射线 */}
      {[45, 135, 225, 315].map((a) => (
        <rect
          key={a} x="97.5" y="18" width="5" height="48" rx="1.5"
          fill={cL} opacity=".5" transform={`rotate(${a} 100 100)`}
        />
      ))}

      {/* 尖端菱形 */}
      {[0, 90, 180, 270].map((a) => (
        <path
          key={`d${a}`} d="M100,2 L106,15 L100,28 L94,15Z"
          fill={c} transform={`rotate(${a} 100 100)`}
        />
      ))}

      {/* 内圈 */}
      <circle cx="100" cy="100" r="32" fill="none" stroke={c} strokeWidth="1.4" />

      {/* 中心花结 */}
      <circle cx="100" cy="100" r="16" fill="none" stroke={c} strokeWidth="1.8" />
      <path
        d="M90,90 Q100,80 110,90 Q120,100 110,110 Q100,120 90,110 Q80,100 90,90Z"
        fill="none" stroke={c} strokeWidth="1.3"
      />
    </svg>
  );
}

// 顶部 / 底部翼形装饰
function Ornament({ flip }) {
  return (
    <svg
      viewBox="0 0 120 34"
      className="ptOrn__svg"
      style={flip ? { transform: "scaleY(-1)" } : undefined}
    >
      {/* 主翼线 */}
      <path
        d="M6,28 Q26,25 42,16 L48,6 L50,1 L52,6 L58,16 Q74,25 94,28"
        fill="none" stroke="#b89a5e" strokeWidth="2" strokeLinecap="round"
      />
      {/* 外翼延伸 */}
      <path
        d="M3,27 Q5,28 8,28 M92,28 Q95,28 97,27"
        fill="none" stroke="#b89a5e" strokeWidth="1.8" strokeLinecap="round"
      />
      {/* 内翼纹 */}
      <path
        d="M18,25 Q34,20 44,12 L49,5 M82,25 Q66,20 56,12 L51,5"
        fill="none" stroke="#a08a50" strokeWidth=".8" opacity=".45"
      />
      {/* 中心宝石 */}
      <path d="M50,0 L56,14 L50,28 L44,14Z" fill="#6d918a" stroke="#b89a5e" strokeWidth="1.2" />
      <path d="M50,3 L53,14 L50,25" fill="none" stroke="rgba(170,215,200,.3)" strokeWidth=".7" />
    </svg>
  );
}

/* ------------------------------------------------
   PokerTable 主组件
   ------------------------------------------------ */
export default function PokerTable() {
  const [seats] = useState(() =>
    Array.from({ length: SEAT_COUNT }, (_, i) => ({ id: i, player: null }))
  );

  return (
    <div className="tableArea">
      <div className="pokerTable">
        {/* ====== 牌桌框架 ====== */}
        <div className="ptFrame">
          {/* 顶部装饰 */}
          <div className="ptOrn ptOrn--top"><Ornament /></div>

          {/* 桌面 */}
          <div className="ptSurface">
            <div className="ptDivider" />
            <div className="ptEmblem"><Emblem /></div>

            {/* 示例卡牌展示 */}
            <div className="ptCards">
              <PokerCard suit="heart" rank={1} size="md" />
              <PokerCard suit="spade" rank={13} size="md" />
              <PokerCard suit="diamond" rank={12} size="md" />
              <PokerCard suit="club" rank={11} size="md" faceDown />
              <PokerCard suit="heart" rank={10} size="md" faceDown />
            </div>
          </div>

          {/* 底部装饰 */}
          <div className="ptOrn ptOrn--bot"><Ornament flip /></div>

          {/* 四角宝石 */}
          <i className="ptGem ptGem--tl" />
          <i className="ptGem ptGem--tr" />
          <i className="ptGem ptGem--bl" />
          <i className="ptGem ptGem--br" />
        </div>

        {/* ====== 桌面状态 ====== */}
        <div className="ptOverlay">
          <div className="ptStatus">等待玩家加入…</div>
        </div>

        {/* ====== 座位 ====== */}
        {seats.map((seat) => {
          const pos = SEAT_POSITIONS[seat.id];
          return (
            <div
              key={seat.id}
              className="seat"
              style={{ left: pos.left, top: pos.top }}
            >
              <div className="seat__inner">
                {seat.player ? (
                  <div className="seat__player">
                    <div className="seat__avatar">{seat.player.phone?.slice(-2)}</div>
                    <div className="seat__name">{seat.player.phone}</div>
                  </div>
                ) : (
                  <div className="seat__empty"><span className="seat__emptyIcon">+</span></div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== 操作按钮 ====== */}
      <div className="tableActions">
        <button className="tableBtn tableBtn--primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          开始游戏
        </button>
        <button className="tableBtn tableBtn--secondary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          加入牌桌
        </button>
      </div>
    </div>
  );
}
