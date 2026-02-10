import { useState, useCallback } from "react";

export default function InviteModal({ visible, onClose, room }) {
  const [copied, setCopied] = useState(false);

  const inviteCode = room?.inviteCode || "------";
  const inviteLink = `${window.location.origin}/join?code=${inviteCode}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      const input = document.createElement("input");
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteLink]);

  if (!visible) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">邀请好友</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="inviteContent">
          {/* 当前房间邀请码 */}
          <label className="inviteLabel">我的房间邀请码</label>
          <div className="inviteCodeBox">
            <span className="inviteCode">{inviteCode}</span>
          </div>

          <label className="inviteLabel" style={{ marginTop: 16 }}>邀请链接</label>
          <div className="inviteLinkBox">
            <input
              className="inviteLinkInput"
              readOnly
              value={inviteLink}
              onFocus={(e) => e.target.select()}
            />
            <button className="inviteCopyBtn" onClick={handleCopy}>
              {copied ? "已复制 ✓" : "复制"}
            </button>
          </div>

          <p className="inviteHint">将邀请码或链接分享给好友，即可加入你的牌桌</p>
        </div>
      </div>
    </div>
  );
}
