import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../auth/AuthContext.jsx";

export default function LobbyHeader({ onShowStats, onShowInvite }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  const initial = user?.phone?.slice(-2) ?? "??";

  return (
    <header className="lobbyHeader">
      <div className="lobbyHeader__logo">
        <span className="lobbyHeader__logoIcon">🃏</span>
        <span className="lobbyHeader__logoText">德州扑克</span>
      </div>

      <div className="navPillWrap" ref={menuRef}>
        <nav className="navPill">
          {/* 1 */}
          <button className="navPill__item" onClick={onShowInvite}>
            邀请好友
          </button>
          {/* 2 */}
          <button className="navPill__item" onClick={onShowStats}>
            数据统计
          </button>
          {/* 3 — avatar */}
          <button
            className="navPill__item navPill__item--avatar"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="navPill__avatarCircle">{initial}</span>
          </button>
          {/* slider */}
          <div className="navPill__slider" />
        </nav>

        {menuOpen && (
          <div className="avatarMenu">
            <div className="avatarMenu__phone">{user?.phone}</div>
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
