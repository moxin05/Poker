import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { useSocket } from "../../hooks/useSocket.js";
import * as roomApi from "../../api/room.js";
import LobbyHeader from "./components/LobbyHeader.jsx";
import PokerTable from "./components/PokerTable.jsx";
import StatsPanel from "./components/StatsPanel.jsx";
import InviteModal from "./components/InviteModal.jsx";
import JoinRoomModal from "./components/JoinRoomModal.jsx";
import "./lobby.css";

export default function LobbyPage() {
  const { token } = useAuth();
  const [showStats, setShowStats] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [room, setRoom] = useState(null);

  // 获取/创建房间
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await roomApi.getCurrentRoom(token);
        if (!cancelled) setRoom(data.room);
      } catch (err) {
        console.error("获取房间失败:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  // WebSocket
  const { emit, on, connected } = useSocket(room?.id);

  // 监听房间实时更新
  useEffect(() => {
    if (!on) return;
    const off = on("room:updated", (updatedRoom) => {
      setRoom(updatedRoom);
    });
    return off;
  }, [on]);

  // 加入房间
  const handleJoinRoom = useCallback(async (inviteCode) => {
    const data = await roomApi.joinRoom(token, inviteCode);
    setRoom(data.room);
  }, [token]);

  // 退出牌桌
  const handleLeaveRoom = useCallback(async () => {
    if (!room?.id) return;
    try {
      await roomApi.leaveRoom(token, room.id);
      // 退出后自动获取/创建新房间
      const data = await roomApi.getCurrentRoom(token);
      setRoom(data.room);
    } catch (err) {
      console.error("退出牌桌失败:", err);
    }
  }, [token, room?.id]);

  return (
    <div className="lobby">
      <LobbyHeader
        onShowStats={() => setShowStats(true)}
        onShowInvite={() => setShowInvite(true)}
      />

      <main className="lobby__main">
        <PokerTable
          room={room}
          onJoinTable={() => setShowJoin(true)}
          onLeaveTable={handleLeaveRoom}
          wsEmit={emit}
          wsOn={on}
          wsConnected={connected}
        />
      </main>

      <StatsPanel visible={showStats} onClose={() => setShowStats(false)} />
      <InviteModal visible={showInvite} onClose={() => setShowInvite(false)} room={room} />
      <JoinRoomModal visible={showJoin} onClose={() => setShowJoin(false)} onJoin={handleJoinRoom} />
    </div>
  );
}
