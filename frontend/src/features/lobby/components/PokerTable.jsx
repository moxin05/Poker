import { useState, useCallback, useMemo } from "react";
import { useAuth } from "../../../auth/AuthContext.jsx";
import PokerCard from "../../../components/PokerCard.jsx";
import ActionBar from "./ActionBar.jsx";

const SEAT_COUNT = 8;

// 座位 5 = 下方正中 = 当前玩家默认位置
const MY_SEAT_INDEX = 5;

const SEAT_POSITIONS = [
  { left: "25%",   top: "4%" },
  { left: "50%",   top: "4%" },
  { left: "75%",   top: "4%" },
  { left: "97.5%", top: "50%" },
  { left: "75%",   top: "96%" },
  { left: "50%",   top: "96%" },   // 5: 当前用户
  { left: "25%",   top: "96%" },
  { left: "2.5%",  top: "50%" },
];

// 模拟公共牌和手牌（后续对接后端）
const MOCK_COMMUNITY = [
  { suit: "heart", rank: 1 },
  { suit: "spade", rank: 13 },
  { suit: "diamond", rank: 12 },
  { suit: "club", rank: 7 },
  { suit: "heart", rank: 10 },
];

const MOCK_HAND = [
  { suit: "spade", rank: 1 },
  { suit: "heart", rank: 13 },
];

/* ------------------------------------------------
   内联 SVG 装饰
   ------------------------------------------------ */
function Emblem() {
  const c = "rgba(125, 168, 152, 0.28)";
  const cL = "rgba(125, 168, 152, 0.18)";
  return (
    <svg viewBox="0 0 200 200" className="ptEmblem__svg">
      <circle cx="100" cy="100" r="88" fill="none" stroke={c} strokeWidth="1.4" />
      {[0, 90, 180, 270].map((a) => (
        <rect key={a} x="95" y="12" width="10" height="58" rx="2.5"
          fill={cL} transform={`rotate(${a} 100 100)`} />
      ))}
      {[45, 135, 225, 315].map((a) => (
        <rect key={a} x="97.5" y="18" width="5" height="48" rx="1.5"
          fill={cL} opacity=".5" transform={`rotate(${a} 100 100)`} />
      ))}
      {[0, 90, 180, 270].map((a) => (
        <path key={`d${a}`} d="M100,2 L106,15 L100,28 L94,15Z"
          fill={c} transform={`rotate(${a} 100 100)`} />
      ))}
      <circle cx="100" cy="100" r="32" fill="none" stroke={c} strokeWidth="1.4" />
      <circle cx="100" cy="100" r="16" fill="none" stroke={c} strokeWidth="1.8" />
      <path d="M90,90 Q100,80 110,90 Q120,100 110,110 Q100,120 90,110 Q80,100 90,90Z"
        fill="none" stroke={c} strokeWidth="1.3" />
    </svg>
  );
}

function Ornament({ flip }) {
  return (
    <svg viewBox="0 0 120 34" className="ptOrn__svg"
      style={flip ? { transform: "scaleY(-1)" } : undefined}>
      <path d="M6,28 Q26,25 42,16 L48,6 L50,1 L52,6 L58,16 Q74,25 94,28"
        fill="none" stroke="#b89a5e" strokeWidth="2" strokeLinecap="round" />
      <path d="M3,27 Q5,28 8,28 M92,28 Q95,28 97,27"
        fill="none" stroke="#b89a5e" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18,25 Q34,20 44,12 L49,5 M82,25 Q66,20 56,12 L51,5"
        fill="none" stroke="#a08a50" strokeWidth=".8" opacity=".45" />
      <path d="M50,0 L56,14 L50,28 L44,14Z" fill="#6d918a" stroke="#b89a5e" strokeWidth="1.2" />
      <path d="M50,3 L53,14 L50,25" fill="none" stroke="rgba(170,215,200,.3)" strokeWidth=".7" />
    </svg>
  );
}

/* ------------------------------------------------
   PokerTable 主组件
   ------------------------------------------------ */
export default function PokerTable({ room }) {
  const { user } = useAuth();

  // 构建座位列表：从 room.players 填充，当前用户默认在 seat 5
  const seats = useMemo(() => {
    const list = Array.from({ length: SEAT_COUNT }, (_, i) => ({
      id: i,
      player: null,
      isMe: false,
    }));

    if (room?.players?.length) {
      // 用后端返回的座位数据
      for (const p of room.players) {
        const idx = p.seatIndex;
        if (idx >= 0 && idx < SEAT_COUNT) {
          list[idx] = { id: idx, player: p, isMe: p.id === user?.id };
        }
      }
    } else if (user) {
      // 没有 room 数据时，至少显示自己在座位 5
      list[MY_SEAT_INDEX] = {
        id: MY_SEAT_INDEX,
        player: { id: user.id, phone: user.phone, avatar: user.avatar, chips: 1000, seatIndex: MY_SEAT_INDEX },
        isMe: true,
      };
    }

    return list;
  }, [room, user]);

  // 游戏状态: waiting | dealing | playing
  const [gameState, setGameState] = useState("waiting");

  // 公共牌翻面状态
  const [communityRevealed, setCommunityRevealed] = useState([true, true, true, true, true]);

  // 手牌翻面状态
  const [handRevealed, setHandRevealed] = useState([true, true]);

  // 发牌完成标记（控制动画结束后才可交互）
  const [dealDone, setDealDone] = useState(false);

  const handleStartGame = useCallback(() => {
    setGameState("dealing");
    setCommunityRevealed([true, true, true, true, true]); // 公共牌先背面
    setHandRevealed([true, true]); // 手牌先背面
    setDealDone(false);

    // 发牌动画完成后切换到 playing
    setTimeout(() => {
      setGameState("playing");
      setDealDone(true);
      // 翻开手牌
      setTimeout(() => setHandRevealed([false, false]), 300);
      // 逐步翻开公共牌 (flop → turn → river)
      setTimeout(() => setCommunityRevealed([false, false, false, true, true]), 800);
      setTimeout(() => setCommunityRevealed([false, false, false, false, true]), 1600);
      setTimeout(() => setCommunityRevealed(prev => prev.map(() => false)), 2400);
    }, 1200); // 发牌动画时长
  }, []);

  const handleExitGame = useCallback(() => {
    setGameState("waiting");
    setDealDone(false);
  }, []);

  const isPlaying = gameState === "playing" || gameState === "dealing";

  return (
    <div className="tableArea">
      {/* 退出牌局按钮 — 牌桌左侧外 */}
      {isPlaying && (
        <button className="exitBtn" onClick={handleExitGame}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          退出牌局
        </button>
      )}

      <div className="pokerTable">
        {/* ====== 牌桌框架 ====== */}
        <div className="ptFrame">
          <div className="ptOrn ptOrn--top"><Ornament /></div>

          <div className="ptSurface">
            <div className="ptDivider" />
            <div className="ptEmblem"><Emblem /></div>

            {isPlaying && (
              <div className="ptGameArea">
                {/* 上半区：底池 + 公牌 */}
                <div className="ptGameArea__center">
                  {dealDone && (
                    <div className="ptPot">
                      底池: <span className="ptPot__value">120</span>
                    </div>
                  )}

                  <div className="ptCards">
                    {MOCK_COMMUNITY.map((card, i) => (
                      <div
                        key={i}
                        className="ptCards__dealSlot"
                        style={{ "--deal-i": i }}
                      >
                        <PokerCard
                          suit={card.suit}
                          rank={card.rank}
                          size="sm"
                          faceDown={communityRevealed[i]}
                          disabled={!dealDone}
                          onClick={() =>
                            dealDone && setCommunityRevealed(prev =>
                              prev.map((v, j) => (j === i ? !v : v))
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 底部：操作栏贴着牌桌下边缘 */}
                {dealDone && (
                  <div className="ptGameArea__bottom">
                    <ActionBar
                      currentBet={40}
                      minRaise={20}
                      maxRaise={1000}
                      pot={120}
                      canCheck={false}
                      onCheck={() => console.log("check")}
                      onCall={() => console.log("call")}
                      onFold={() => console.log("fold")}
                      onRaise={(amt) => console.log("raise", amt)}
                      onAllIn={() => console.log("all-in")}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="ptOrn ptOrn--bot"><Ornament flip /></div>
          <i className="ptGem ptGem--tl" />
          <i className="ptGem ptGem--tr" />
          <i className="ptGem ptGem--bl" />
          <i className="ptGem ptGem--br" />
        </div>

        {/* 桌面状态 */}
        {!isPlaying && (
          <div className="ptOverlay">
            <div className="ptStatus">等待玩家加入…</div>
          </div>
        )}

        {/* 座位 */}
        {seats.map((seat) => {
          const pos = SEAT_POSITIONS[seat.id];
          const p = seat.player;
          return (
            <div
              key={seat.id}
              className={`seat ${seat.isMe ? "seat--me" : ""}`}
              style={{ left: pos.left, top: pos.top }}
            >
              <div className="seat__inner">
                {p ? (
                  p.avatar ? (
                    <img className="seat__avatarFull" src={p.avatar} alt="" />
                  ) : (
                    <span className="seat__initials">{p.phone?.slice(-2)}</span>
                  )
                ) : (
                  <span className="seat__emptyIcon">+</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== 底部区域：按钮 或 手牌 ====== */}
      {!isPlaying ? (
        <div className="tableActions">
          <button className="tableBtn tableBtn--primary" onClick={handleStartGame}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            开始游戏
          </button>
          <button className="tableBtn tableBtn--secondary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            加入牌桌
          </button>
        </div>
      ) : (
        <div className="playerHand">
          {MOCK_HAND.map((card, i) => (
            <div
              key={i}
              className="playerHand__slot"
              style={{ "--hand-i": i }}
            >
              <PokerCard
                suit={card.suit}
                rank={card.rank}
                size="sm"
                faceDown={handRevealed[i]}
                disabled
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
