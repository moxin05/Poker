import React from 'react'
import PokerCard from './PokerCard'

export default function PlayerSeat({ player, position, isDealer, isCurrentTurn, isMe, betPosition }) {
  const cls = ['player-seat', isMe && 'is-me', isCurrentTurn && 'is-current-turn', player.is_folded && 'is-folded'].filter(Boolean).join(' ')
  const hasCards = player.hole_cards.length > 0 || player.card_count > 0
  const showFaceUp = player.hole_cards.length > 0
  const cardSize = isMe ? 'large' : 'small'
  const profit = player.profit || 0
  const profitClass = profit > 0 ? 'positive' : profit < 0 ? 'negative' : ''

  return (
    <>
      <div className={cls} style={position}>
        {hasCards && (
          <div className="seat-cards">
            {showFaceUp
              ? player.hole_cards.map((c, i) => <PokerCard key={i} card={c} size={cardSize} />)
              : <><PokerCard faceDown size={cardSize} /><PokerCard faceDown size={cardSize} /></>
            }
          </div>
        )}
        <div className="seat-main" style={{ position: 'relative' }}>
          {isDealer && <div className="dealer-btn">D</div>}
          <div className="player-name" title={player.username}>{player.username}</div>
          <div className="player-chips">💰 {player.chips}</div>
          <div className={`player-profit-badge ${profitClass}`}>{profit >= 0 ? '+' : ''}{profit}</div>
          {player.is_folded && <div className="player-status folded">弃牌</div>}
          {player.is_all_in && <div className="player-status all-in">ALL IN</div>}
          {player.total_borrowed > 0 && <div className="player-borrowed">赊{player.total_borrowed}</div>}
        </div>
      </div>
      {player.current_bet > 0 && betPosition && <div className="player-bet-chip" style={betPosition}>{player.current_bet}</div>}
    </>
  )
}
