import React, { useState, useEffect, useCallback } from 'react'
import socket from '../../socket'
import { SUIT_MAP, DURATION_OPTIONS } from '../../constants'
import { formatTime, getSeatPosition, getBetPosition } from '../../utils/format'
import PokerCard from './PokerCard'
import PlayerSeat from './PlayerSeat'
import GameOver from './GameOver'

export default function Game({ gameState, mySid, onShowStats }) {
  const [raiseAmount, setRaiseAmount] = useState(0)
  const [localTime, setLocalTime] = useState(gameState.remaining_time || 0)

  const myIndex = gameState.my_index
  const players = gameState.players
  const numPlayers = players.length
  const isMyTurn = gameState.current_player_sid === mySid
  const myPlayer = players[myIndex] || {}
  const availableActions = gameState.available_actions || []
  const isWaiting = gameState.game_state === 'waiting'
  const isShowdown = gameState.game_state === 'showdown'
  const isFinished = gameState.game_state === 'finished'
  const isHost = gameState.host_sid === mySid

  useEffect(() => { setLocalTime(gameState.remaining_time || 0) }, [gameState.remaining_time])
  useEffect(() => {
    if (!gameState.is_game_active || localTime <= 0) return
    const id = setInterval(() => setLocalTime(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(id)
  }, [gameState.is_game_active, localTime])
  useEffect(() => { if (isMyTurn && gameState.min_raise) setRaiseAmount(gameState.min_raise) }, [isMyTurn, gameState.min_raise])

  const handleAction = useCallback((action, amount) => socket.emit('player_action', { action, amount }), [])
  const handleBorrow = () => socket.emit('borrow_chips')

  if (isFinished && gameState.final_results) return <GameOver results={gameState.final_results} roomId={gameState.room_id} />

  if (isWaiting) {
    return (
      <div className="waiting-room">
        <div className="waiting-card">
          <h2>🃏 等待玩家加入</h2>
          <div className="waiting-room-code">{gameState.room_id}</div>
          <p className="waiting-hint">分享房间号给好友，邀请他们加入</p>
          <div className="player-list">
            {players.map(p => (
              <div key={p.sid} className="player-item">
                <span className="avatar-icon">👤</span><span>{p.username}</span>
                {p.sid === gameState.host_sid && <span className="host-badge">房主</span>}
              </div>
            ))}
          </div>
          {isHost && (
            <div className="start-section">
              <div className="duration-selector">
                <label>对局时长：</label>
                <div className="duration-options">
                  {DURATION_OPTIONS.map(min => (
                    <button key={min} className={`duration-btn ${min === 10 ? 'active' : ''}`}
                      onClick={e => { document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active')); e.target.classList.add('active'); e.target.dataset.value = min }}
                      data-value={min}>{min}分钟</button>
                  ))}
                </div>
              </div>
              <button className="start-btn" disabled={players.length < 2}
                onClick={() => { const a = document.querySelector('.duration-btn.active'); socket.emit('start_game', { duration: a ? parseInt(a.dataset.value) || 10 : 10 }) }}>
                {players.length < 2 ? '等待更多玩家...' : `开始游戏 (${players.length}人)`}
              </button>
            </div>
          )}
          {!isHost && <p className="waiting-hint">等待房主开始游戏...</p>}
          <button className="waiting-leave-btn" onClick={() => socket.emit('leave_room')}>离开房间</button>
        </div>
      </div>
    )
  }

  const timeWarning = localTime > 0 && localTime <= 60

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-header-left">
          <span className="room-code">房间 {gameState.room_id}</span>
          <span className="blind-info">盲注 {gameState.small_blind}/{gameState.big_blind}</span>
          <span className="hand-info">第 {gameState.hand_number} 手</span>
        </div>
        <div className="game-header-center">
          {gameState.is_game_active && <span className={`timer-display ${timeWarning ? 'warning' : ''}`}>⏱ {formatTime(localTime)}</span>}
        </div>
        <div className="game-header-right">
          <span className={`my-profit ${myPlayer.profit >= 0 ? 'positive' : 'negative'}`}>{myPlayer.profit >= 0 ? '+' : ''}{myPlayer.profit || 0}</span>
          <button className="stats-btn-small" onClick={onShowStats}>📊</button>
          <button className="leave-btn" onClick={() => socket.emit('leave_room')}>离开</button>
        </div>
      </div>

      <div className="table-area">
        <div className="poker-table">
          {gameState.pot > 0 && <div className="pot-display"><span className="pot-icon">🪙</span><span>底池: {gameState.pot}</span></div>}
          <div className="community-cards">{gameState.community_cards.map((c, i) => <PokerCard key={i} card={c} />)}</div>
        </div>
        <div className="seats-container">
          {players.map((p, idx) => (
            <PlayerSeat key={p.sid} player={p}
              position={getSeatPosition(idx, numPlayers, myIndex)}
              isDealer={idx === gameState.dealer_idx}
              isCurrentTurn={p.sid === gameState.current_player_sid}
              isMe={p.sid === mySid}
              betPosition={p.current_bet > 0 ? getBetPosition(idx, numPlayers, myIndex) : null} />
          ))}
        </div>
      </div>

      {isMyTurn && availableActions.length > 0 && (
        <div className="action-panel">
          {myPlayer.chips < gameState.big_blind && <button className="action-btn borrow" onClick={handleBorrow}>💰 赊账 +500</button>}
          {availableActions.includes('fold') && <button className="action-btn fold" onClick={() => handleAction('fold')}>弃牌</button>}
          {availableActions.includes('check') && <button className="action-btn check" onClick={() => handleAction('check')}>过牌</button>}
          {availableActions.includes('call') && <button className="action-btn call" onClick={() => handleAction('call')}>跟注 {gameState.call_amount}</button>}
          {availableActions.includes('raise') && (
            <div className="raise-controls">
              <input className="raise-slider" type="range" min={gameState.min_raise} max={myPlayer.chips + (myPlayer.current_bet || 0)} value={raiseAmount} onChange={e => setRaiseAmount(Number(e.target.value))} />
              <span className="raise-amount-display">{raiseAmount}</span>
              <div className="raise-quick-btns">
                <button className="raise-quick-btn" onClick={() => setRaiseAmount(gameState.min_raise)}>最小</button>
                <button className="raise-quick-btn" onClick={() => setRaiseAmount(Math.floor(gameState.pot / 2 + gameState.current_bet))}>½池</button>
                <button className="raise-quick-btn" onClick={() => setRaiseAmount(gameState.pot + gameState.current_bet)}>满池</button>
              </div>
              <button className="action-btn raise" onClick={() => handleAction('raise', raiseAmount)}>加注 {raiseAmount}</button>
            </div>
          )}
          {availableActions.includes('allin') && <button className="action-btn allin" onClick={() => handleAction('allin')}>ALL IN {myPlayer.chips}</button>}
        </div>
      )}

      {!isMyTurn && !isShowdown && gameState.game_state !== 'finished' && (
        <div className="action-panel" style={{ justifyContent: 'center' }}>
          {myPlayer.chips < gameState.big_blind && <button className="action-btn borrow" onClick={handleBorrow}>💰 赊账 +500</button>}
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {gameState.current_player_sid ? `等待 ${players.find(p => p.sid === gameState.current_player_sid)?.username || '...'} 行动` : '等待中...'}
          </span>
        </div>
      )}

      {isShowdown && gameState.hand_result && (
        <div className="showdown-banner">
          <div className="showdown-content">
            <span className="showdown-icon">🏆</span>
            <div className="showdown-info">
              {gameState.winners?.map((w, i) => (
                <div key={i} className="showdown-winner">
                  <strong>{w.username}</strong>
                  {w.hand_name && <span className="showdown-hand"> {w.hand_name}</span>}
                  <span className="showdown-amount"> +{w.amount}</span>
                  <span className="showdown-cards">
                    {w.cards?.map((c, j) => <span key={j} className={c.suit === 'heart' || c.suit === 'diamond' ? 'red-card' : 'black-card'}>{c.rank}{SUIT_MAP[c.suit]?.symbol}</span>)}
                  </span>
                </div>
              ))}
            </div>
            <span className="showdown-next">下一手即将开始...</span>
          </div>
        </div>
      )}
    </div>
  )
}
