import { useState } from "react";
import LobbyHeader from "./components/LobbyHeader.jsx";
import PokerTable from "./components/PokerTable.jsx";
import StatsPanel from "./components/StatsPanel.jsx";
import InviteModal from "./components/InviteModal.jsx";
import "./lobby.css";

export default function LobbyPage() {
  const [showStats, setShowStats] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="lobby">
      <LobbyHeader
        onShowStats={() => setShowStats(true)}
        onShowInvite={() => setShowInvite(true)}
      />

      <main className="lobby__main">
        <PokerTable />
      </main>

      <StatsPanel visible={showStats} onClose={() => setShowStats(false)} />
      <InviteModal visible={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  );
}
