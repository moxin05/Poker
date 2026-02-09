import { useAuth } from "../../auth/AuthContext.jsx";
import "./home.css";

export default function HomePlaceholder() {
  const { user, logout } = useAuth();
  return (
    <div className="home">
      <div className="home__card">
        <div className="home__title">已登录（占位页）</div>
        <div className="home__sub">手机号：{user?.phone ?? "-"}</div>
        <button className="home__btn" onClick={logout}>
          退出登录
        </button>
      </div>
    </div>
  );
}

