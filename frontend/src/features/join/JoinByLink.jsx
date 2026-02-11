import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext.jsx";
import * as roomApi from "../../api/room.js";

/**
 * /join?code=XXXXXX 路由
 * 通过链接直接加入牌桌，加入后跳转到主页
 */
export default function JoinByLink() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [status, setStatus] = useState("joining"); // joining | error
  const [error, setError] = useState("");

  const code = searchParams.get("code") || "";

  useEffect(() => {
    if (!token || !code) {
      setStatus("error");
      setError(!code ? "缺少邀请码" : "请先登录");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await roomApi.joinRoom(token, code);
        if (!cancelled) navigate("/", { replace: true });
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(err?.message || "加入失败");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token, code, navigate]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#3a322c",
      color: "#f0e4d0",
      textAlign: "center",
      padding: 24,
    }}>
      {status === "joining" ? (
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>加入牌桌中…</div>
          <div style={{ opacity: 0.5 }}>邀请码: {code}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#d4a09a" }}>{error}</div>
          <button
            onClick={() => navigate("/", { replace: true })}
            style={{
              marginTop: 16, padding: "10px 24px", borderRadius: 10,
              border: "1px solid rgba(196,162,101,0.3)",
              background: "rgba(196,162,101,0.12)", color: "#dcc18a",
              cursor: "pointer", fontSize: 14,
            }}
          >
            返回大厅
          </button>
        </div>
      )}
    </div>
  );
}
