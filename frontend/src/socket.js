import { io } from 'socket.io-client'
import { BACKEND_URL } from './constants'

const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
})

socket.on('connect', () => console.log('已连接到服务器:', socket.id))
socket.on('disconnect', () => console.log('与服务器断开连接'))

export default socket
