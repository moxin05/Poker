import React from 'react'
import { formatTimestamp, formatDuration } from '../../utils/format'

export default function Stats({ data, onClose }) {
  const { stats, history } = data

  return (
    <div className="stats-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="stats-modal">
        <div className="stats-header">
          <h2>📊 {stats.username} 的战绩</h2>
          <button className="stats-close" onClick={onClose}>✕</button>
        </div>
        <div className="stats-grid">
          {[
            [stats.total_games, '总对局'], [stats.total_hands, '总手数'],
            [stats.hands_won, '赢的手数'], [`${stats.win_rate}%`, '胜率'],
          ].map(([v, l], i) => <div key={i} className="stat-card"><div className="stat-value">{v}</div><div className="stat-label">{l}</div></div>)}
          <div className={`stat-card ${stats.total_profit >= 0 ? 'positive' : 'negative'}`}>
            <div className="stat-value">{stats.total_profit >= 0 ? '+' : ''}{stats.total_profit}</div><div className="stat-label">总盈亏</div>
          </div>
          <div className="stat-card"><div className="stat-value">{stats.total_borrowed}</div><div className="stat-label">累计赊账</div></div>
          <div className="stat-card positive"><div className="stat-value">+{stats.biggest_win}</div><div className="stat-label">最大赢</div></div>
          <div className="stat-card negative"><div className="stat-value">{stats.biggest_loss}</div><div className="stat-label">最大输</div></div>
        </div>
        {history?.length > 0 ? (<>
          <h3 className="stats-section-title">近期对局</h3>
          <div className="stats-history">
            {history.map((g, i) => (
              <div key={i} className="history-item">
                <span className="history-room">房间 {g.room_id}</span>
                <span className="history-hands">{g.hands_played}手</span>
                <span className="history-duration">{formatDuration(g.duration)}</span>
                <span className={`history-profit ${g.profit >= 0 ? 'positive' : 'negative'}`}>{g.profit >= 0 ? '+' : ''}{g.profit}</span>
                <span className="history-time">{formatTimestamp(g.played_at)}</span>
              </div>
            ))}
          </div>
        </>) : <div className="stats-empty">暂无对局记录，快去开一局吧！</div>}
      </div>
    </div>
  )
}
