import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext.jsx";
import VideoBackground from "../../components/VideoBackground.jsx";
import "./auth.css";

export default function AuthPage() {
  const auth = useAuth();
  const [mode, setMode] = useState("login"); // login | register
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const title = useMemo(() => (mode === "login" ? "登录" : "注册"), [mode]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const payload = { phone: phone.trim(), password };
      if (mode === "login") await auth.login(payload);
      else await auth.register(payload);
    } catch (err) {
      setError(err?.message || "操作失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="authPage">
      <VideoBackground src="/asset/background.mp4" />

      <div className="authPage__content">
        <div className="glassCard" role="dialog" aria-label="登录窗口">
          <div className="glassCard__brand">
            <div className="brandTitle">德州扑克</div>
            <div className="brandSub">原神主题 · 过年和朋友一起玩</div>
          </div>

          <div className="tabs">
            <button
              type="button"
              className={mode === "login" ? "tab tab--active" : "tab"}
              onClick={() => setMode("login")}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === "register" ? "tab tab--active" : "tab"}
              onClick={() => setMode("register")}
            >
              注册
            </button>
          </div>

          <form className="form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">手机号</span>
              <input
                className="input"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">密码</span>
              <input
                className="input"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="请输入密码（至少 6 位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error ? <div className="error">{error}</div> : null}

            <button className="primaryBtn" disabled={isSubmitting}>
              {isSubmitting ? "请稍候…" : title}
            </button>

            <div className="hint">
              {mode === "login" ? (
                <span>
                  没有账号？{" "}
                  <button
                    type="button"
                    className="linkBtn"
                    onClick={() => setMode("register")}
                  >
                    去注册
                  </button>
                </span>
              ) : (
                <span>
                  已有账号？{" "}
                  <button
                    type="button"
                    className="linkBtn"
                    onClick={() => setMode("login")}
                  >
                    去登录
                  </button>
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

