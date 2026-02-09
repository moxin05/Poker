import React, { useState } from 'react'
import socket from '../../socket'

export default function Lobby({ username, stats, onShowStats }) {
  const [roomId, setRoomId] = useState('')

  return (
    <div className="lobby-container">
      <div className="lobby-card">
        <div className="lobby-header"><h1>🃏 德州扑克</h1><p>与好友一起畅玩</p></div>
        <div className="lobby-user-info">
          <span>👤</span><span>欢迎，</span><span className="username">{username}</span>
          {stats && stats.total_games > 0 && (
            <span className={`lobby-profit ${stats.total_profit >= 0 ? 'positive' : 'negative'}`}>
              总盈亏: {stats.total_profit >= 0 ? '+' : ''}{stats.total_profit}
            </span>
          )}
        </div>
        <div className="lobby-section"><button className="lobby-btn create" onClick={() => socket.emit('create_room')}>🎯 创建新房间</button></div>
        <div className="lobby-divider"><span>或者加入好友房间</span></div>
        <form className="lobby-section" onSubmit={e => { e.preventDefault(); if (roomId.trim()) socket.emit('join_room', { room_id: roomId.trim() }) }}>
          <div className="lobby-join-row">
            <input className="lobby-input" type="text" placeholder="输入房间号" value={roomId} onChange={e => setRoomId(e.target.value)} maxLength={6} />
            <button className="lobby-btn join" type="submit">加入</button>
          </div>
        </form>
        <div className="lobby-divider"><span>个人战绩</span></div>
        <button className="lobby-btn stats" onClick={onShowStats}>📊 查看个人统计</button>
      </div>
    </div>
  )
}
