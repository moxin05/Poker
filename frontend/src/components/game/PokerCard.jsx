import React from 'react'
import { SUIT_MAP } from '../../constants'

export default function PokerCard({ card, size = 'normal', faceDown = false }) {
  if (faceDown || !card) {
    return <div className={`poker-card card-back ${size}`} />
  }
  const info = SUIT_MAP[card.suit] || { symbol: '?', color: 'black' }
  return (
    <div className={`poker-card ${info.color} ${size}`}>
      <span className="card-rank">{card.rank}</span>
      <span className="card-suit">{info.symbol}</span>
    </div>
  )
}
