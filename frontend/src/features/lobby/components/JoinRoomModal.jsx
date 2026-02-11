import { useState, useCallback } from "react";

export default function JoinRoomModal({ visible, onClose, onJoin }) {
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = useCallback(async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setJoining(true);
    setError("");
    try {
      await onJoin(trimmed);
      setCode("");
      onClose();
    } catch (err) {
      setError(err?.message || "加入失败");
    } finally {
      setJoining(false);
    }
  }, [code, onJoin, onClose]);

  if (!visible) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">加入牌桌</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>
        <div className="inviteContent">
          <label className="inviteLabel">输入邀请码</label>
          <div className="inviteLinkBox">
            <input
              className="inviteLinkInput"
              placeholder="6位邀请码"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button
              className="inviteCopyBtn"
              onClick={handleJoin}
              disabled={joining || !code.trim()}
            >
              {joining ? "加入中…" : "加入"}
            </button>
          </div>
          {error && (
            <p style={{ color: "#d4a09a", fontSize: 12, marginTop: 8 }}>{error}</p>
          )}
          <p className="inviteHint">输入好友分享的邀请码，即可加入对方牌桌</p>
        </div>
      </div>
    </div>
  );
}
