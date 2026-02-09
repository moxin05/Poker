import React, { useState, useEffect } from 'react'
import socket from './socket'
import Login from './components/auth/Login'
import Lobby from './components/lobby/Lobby'
import Game from './components/game/Game'
import Stats from './components/game/Stats'

export default function App() {
  const [page, setPage] = useState('login')
  const [nickname, setNickname] = useState('')
  const [sid, setSid] = useState('')
  const [gameState, setGameState] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [error, setError] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [statsData, setStatsData] = useState(null)

  useEffect(() => {
    socket.on('login_success', (data) => {
      setSid(data.sid)
      setNickname(data.nickname)
      setUserStats(data.stats)
      setPage('lobby')
    })
    socket.on('room_joined', (data) => { setGameState(data); setPage('game') })
    socket.on('game_state', (data) => { setGameState(data); if (page !== 'game') setPage('game') })
    socket.on('left_room', () => { setGameState(null); setPage('lobby'); socket.emit('get_stats') })
    socket.on('stats_data', (data) => { setStatsData(data); setUserStats(data.stats); setShowStats(true) })
    socket.on('error', (data) => { setError(data.message); setTimeout(() => setError(''), 3000) })

    return () => {
      ;['login_success', 'room_joined', 'game_state', 'left_room', 'stats_data', 'error'].forEach(e => socket.off(e))
    }
  }, [page])

  return (
    <>
      {error && <div className="error-toast">{error}</div>}
      {showStats && statsData && <Stats data={statsData} onClose={() => setShowStats(false)} />}
      {page === 'login' && <Login />}
      {page === 'lobby' && <Lobby username={nickname} stats={userStats} onShowStats={() => socket.emit('get_stats')} />}
      {page === 'game' && gameState && <Game gameState={gameState} mySid={sid} onShowStats={() => socket.emit('get_stats')} />}
    </>
  )
}
