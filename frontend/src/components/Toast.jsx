import { createContext, useContext, useState, useCallback, useRef } from "react";
import "./Toast.css";

const ToastContext = createContext(null);

let _idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = ++_idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [removeToast]);

  const toast = useCallback({
    info: (msg, dur) => addToast(msg, "info", dur),
    success: (msg, dur) => addToast(msg, "success", dur),
    warn: (msg, dur) => addToast(msg, "warn", dur),
    error: (msg, dur) => addToast(msg, "error", dur),
  }, [addToast]);

  // useCallback 不能直接传对象，用 ref 包装
  const toastRef = useRef(toast);
  toastRef.current = toast;

  return (
    <ToastContext.Provider value={toastRef}>
      {children}
      <div className="toastContainer">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast--${t.type}`}
            onClick={() => removeToast(t.id)}
          >
            <span className="toast__icon">
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : t.type === "warn" ? "!" : "i"}
            </span>
            <span className="toast__msg">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ref = useContext(ToastContext);
  if (!ref) throw new Error("useToast must be used within ToastProvider");
  return ref.current;
}
