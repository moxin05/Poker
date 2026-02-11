import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../auth/AuthContext.jsx";

/**
 * WebSocket 连接 hook
 */
export function useSocket(roomId) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  // 递增计数器，socket 变化时触发依赖它的 useEffect 重新执行
  const [socketVer, setSocketVer] = useState(0);

  useEffect(() => {
    if (!token || !roomId) return;

    const socket = io({
      path: "/ws",
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("room:join", roomId);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("error", (data) => {
      console.error("[ws] error:", data?.message || data);
    });

    socket.on("kicked", () => {
      window.location.href = "/login";
    });

    // 通知外部 socket 已就绪
    setSocketVer((v) => v + 1);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, roomId]);

  // emit 直接用 ref
  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  // on 依赖 socketVer，确保 socket 更换后重新绑定
  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketVer]);

  return { connected, emit, on };
}
