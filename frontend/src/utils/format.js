/**
 * 格式化工具函数
 */

/**
 * 秒数 → 「MM:SS」倒计时字符串
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Unix 时间戳 → 可读日期字符串
 */
export function formatTimestamp(ts) {
  if (!ts) return '-'
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * 秒数 → 「N分钟」
 */
export function formatDuration(seconds) {
  if (!seconds) return '-'
  return `${Math.floor(seconds / 60)}分钟`
}

/**
 * 计算座位在椭圆桌上的定位
 */
export function getSeatPosition(playerIndex, totalPlayers, myIndex) {
  const offset = ((playerIndex - myIndex) % totalPlayers + totalPlayers) % totalPlayers
  const theta = (2 * Math.PI * offset) / totalPlayers
  return {
    left: `${50 + 46 * Math.sin(theta)}%`,
    top: `${50 + 42 * Math.cos(theta)}%`,
    transform: 'translate(-50%, -50%)',
  }
}

/**
 * 计算下注筹码的定位（座位与桌心之间）
 */
export function getBetPosition(playerIndex, totalPlayers, myIndex) {
  const offset = ((playerIndex - myIndex) % totalPlayers + totalPlayers) % totalPlayers
  const theta = (2 * Math.PI * offset) / totalPlayers
  return {
    left: `${50 + 30 * Math.sin(theta)}%`,
    top: `${50 + 28 * Math.cos(theta)}%`,
    transform: 'translate(-50%, -50%)',
    position: 'absolute',
  }
}
