import React from 'react'
import socket from '../../socket'

export default function GameOver({ results, roomId }) {
  return (
    <div className="gameover-overlay">
      <div className="gameover-modal">
        <h2 className="gameover-title">🏆 对局结束</h2>
        <p className="gameover-room">房间 {roomId}</p>
        <div className="gameover-results">
          <div className="results-table">
            <div className="results-header">
              <span className="col-rank">#</span><span className="col-name">玩家</span>
              <span className="col-hands">手数</span><span className="col-winrate">胜率</span>
              <span className="col-borrowed">赊账</span><span className="col-profit">盈亏</span>
            </div>
            {results.map((r, i) => (
              <div key={i} className={`results-row ${i === 0 ? 'winner' : ''}`}>
                <span className="col-rank">{i === 0 ? '👑' : i + 1}</span>
                <span className="col-name">{r.username}</span>
                <span className="col-hands">{r.hands_played}</span>
                <span className="col-winrate">{r.win_rate}%</span>
                <span className="col-borrowed">{r.total_borrowed > 0 ? r.total_borrowed : '-'}</span>
                <span className={`col-profit ${r.profit >= 0 ? 'positive' : 'negative'}`}>{r.profit >= 0 ? '+' : ''}{r.profit}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="gameover-actions">
          <button className="gameover-btn back" onClick={() => socket.emit('leave_room')}>返回大厅</button>
        </div>
      </div>
    </div>
  )
}
