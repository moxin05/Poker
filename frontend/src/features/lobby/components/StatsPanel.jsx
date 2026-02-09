export default function StatsPanel({ visible, onClose }) {
  if (!visible) return null;

  // TODO: 后续对接真实数据
  const stats = {
    totalGames: 0,
    wins: 0,
    winRate: "0%",
    totalEarnings: 0,
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">数据统计</h2>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="statsGrid">
          <div className="statCard">
            <div className="statCard__value">{stats.totalGames}</div>
            <div className="statCard__label">总场次</div>
          </div>
          <div className="statCard">
            <div className="statCard__value">{stats.wins}</div>
            <div className="statCard__label">胜场</div>
          </div>
          <div className="statCard">
            <div className="statCard__value">{stats.winRate}</div>
            <div className="statCard__label">胜率</div>
          </div>
          <div className="statCard">
            <div className="statCard__value">{stats.totalEarnings}</div>
            <div className="statCard__label">总盈利</div>
          </div>
        </div>
      </div>
    </div>
  );
}
