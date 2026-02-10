import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../../auth/AuthContext.jsx";
import * as userApi from "../../../api/user.js";

export default function LobbyHeader({ onShowStats, onShowInvite }) {
  const { user, token, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [uploading, setUploading] = useState(false);
  const menuRef = useRef(null);
  const fileRef = useRef(null);

  // 同步 user.avatar
  useEffect(() => {
    if (user?.avatar) setAvatar(user.avatar);
  }, [user?.avatar]);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // 上传头像
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await userApi.uploadAvatar(token, file);
      setAvatar(data.avatar + "?t=" + Date.now()); // 加时间戳破缓存
    } catch (err) {
      console.error("头像上传失败:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [token]);

  const initial = user?.phone?.slice(-2) ?? "??";

  return (
    <header className="lobbyHeader">
      <div className="lobbyHeader__logo">
        <span className="lobbyHeader__logoIcon">🃏</span>
        <span className="lobbyHeader__logoText">德州扑克</span>
      </div>

      <div className="navPillWrap" ref={menuRef}>
        <nav className="navPill">
          <button className="navPill__item" onClick={onShowInvite}>
            邀请好友
          </button>
          <button className="navPill__item" onClick={onShowStats}>
            数据统计
          </button>
          <button
            className="navPill__item navPill__item--avatar"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {avatar ? (
              <img className="navPill__avatarImg" src={avatar} alt="头像" />
            ) : (
              <span className="navPill__avatarCircle">{initial}</span>
            )}
          </button>
          <div className="navPill__slider" />
        </nav>

        {menuOpen && (
          <div className="avatarMenu">
            {/* 头像预览 + 更换 */}
            <div className="avatarMenu__profile">
              <div
                className="avatarMenu__avatarLarge"
                onClick={() => fileRef.current?.click()}
                title="点击更换头像"
              >
                {avatar ? (
                  <img src={avatar} alt="头像" className="avatarMenu__avatarLargeImg" />
                ) : (
                  <span>{initial}</span>
                )}
                <div className="avatarMenu__avatarOverlay">
                  {uploading ? "上传中…" : "更换"}
                </div>
              </div>
              <div className="avatarMenu__phone">{user?.phone}</div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div className="avatarMenu__sep" />
            <button className="avatarMenu__item" onClick={logout}>
              退出登录
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
