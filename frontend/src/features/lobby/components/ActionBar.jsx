import { useState } from "react";

/**
 * 操作栏 — 德州扑克加注区
 *
 * @param {number}  currentBet  - 当前最高下注额
 * @param {number}  minRaise    - 最小加注额
 * @param {number}  maxRaise    - 最大加注额（玩家筹码）
 * @param {number}  pot         - 底池总额
 * @param {boolean} canCheck    - 是否可以过牌（无人下注时）
 * @param {function} onCheck    - 过牌回调
 * @param {function} onCall     - 跟注回调
 * @param {function} onFold     - 弃牌回调
 * @param {function} onRaise    - 加注回调 (amount) => void
 * @param {function} onAllIn    - 全下回调
 */
export default function ActionBar({
  currentBet = 0,
  minRaise = 20,
  maxRaise = 1000,
  pot = 0,
  canCheck = false,
  onCheck,
  onCall,
  onFold,
  onRaise,
  onAllIn,
}) {
  const [raiseAmount, setRaiseAmount] = useState(minRaise);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  // 快捷加注：底池的 1/2, 2/3, 1x
  const presets = [
    { label: "1/2 底池", value: Math.max(minRaise, Math.floor(pot * 0.5)) },
    { label: "2/3 底池", value: Math.max(minRaise, Math.floor(pot * 0.67)) },
    { label: "1x 底池", value: Math.max(minRaise, pot) },
  ];

  function handleRaise() {
    onRaise?.(raiseAmount);
    setShowRaiseSlider(false);
  }

  return (
    <div className="actionBar">
      {/* 主操作按钮 — 固定不动 */}
      <div className="actionBar__main">
        <button className="actionBar__btn actionBar__btn--fold" onClick={onFold}>
          弃牌
        </button>

        {canCheck ? (
          <button className="actionBar__btn actionBar__btn--check" onClick={onCheck}>
            过牌
          </button>
        ) : (
          <button className="actionBar__btn actionBar__btn--call" onClick={onCall}>
            跟注 {currentBet > 0 && <span className="actionBar__chip">{currentBet}</span>}
          </button>
        )}

        <button
          className={`actionBar__btn actionBar__btn--raise ${showRaiseSlider ? "actionBar__btn--active" : ""}`}
          onClick={() => setShowRaiseSlider((v) => !v)}
        >
          加注
        </button>

        <button className="actionBar__btn actionBar__btn--allin" onClick={onAllIn}>
          All In
        </button>
      </div>

      {/* 加注面板 — 在按钮下方弹出 */}
      {showRaiseSlider && (
        <div className="actionBar__raisePanel">
          <div className="actionBar__raiseHeader">
            <span className="actionBar__raiseLabel">加注金额</span>
            <span className="actionBar__raiseValue">{raiseAmount}</span>
          </div>
          <input
            className="actionBar__slider"
            type="range"
            min={minRaise}
            max={maxRaise}
            step={Math.max(1, Math.floor(minRaise / 2))}
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(Number(e.target.value))}
          />
          <div className="actionBar__presets">
            {presets.map((p) => (
              <button
                key={p.label}
                className="actionBar__presetBtn"
                onClick={() => setRaiseAmount(Math.min(p.value, maxRaise))}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="actionBar__raiseActions">
            <button className="actionBar__btn actionBar__btn--confirm" onClick={handleRaise}>
              确认加注
            </button>
            <button className="actionBar__btn actionBar__btn--cancel" onClick={() => setShowRaiseSlider(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
