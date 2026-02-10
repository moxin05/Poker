import "./LandscapeGuard.css";

/**
 * 竖屏提示 — 仅在竖屏手机时显示，提示用户横屏使用
 */
export default function LandscapeGuard() {
  return (
    <div className="landscapeGuard">
      <div className="landscapeGuard__icon">📱↔️</div>
      <div className="landscapeGuard__title">请横屏使用</div>
      <div className="landscapeGuard__sub">
        为了更好的游戏体验，请将手机旋转至横屏模式
      </div>
    </div>
  );
}
