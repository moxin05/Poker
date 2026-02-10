import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import * as roomApi from "../../api/room.js";
import LobbyHeader from "./components/LobbyHeader.jsx";
import PokerTable from "./components/PokerTable.jsx";
import StatsPanel from "./components/StatsPanel.jsx";
import InviteModal from "./components/InviteModal.jsx";
import "./lobby.css";

export default function LobbyPage() {
  const { token } = useAuth();
  const [showStats, setShowStats] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  // 房间状态
  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);

  // 进入大厅时自动获取/创建房间
  useEffect(() => {
    if (!token) {
      setRoomLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await roomApi.getCurrentRoom(token);
        if (!cancelled) setRoom(data.room);
      } catch (err) {
        console.error("获取房间失败:", err);
      } finally {
        if (!cancelled) setRoomLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="lobby">
      <LobbyHeader
        onShowStats={() => setShowStats(true)}
        onShowInvite={() => setShowInvite(true)}
      />

      <main className="lobby__main">
        <PokerTable room={room} />
      </main>

      <StatsPanel visible={showStats} onClose={() => setShowStats(false)} />
      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        room={room}
      />
    </div>
  );
}
