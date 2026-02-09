import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";
import { clearToken, getToken, setToken } from "./tokenStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        if (!token) return;
        const data = await authApi.me(token);
        if (!cancelled) setUser(data.user);
      } catch {
        if (!cancelled) {
          clearToken();
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // 没有 token 的场景也要结束 bootstrapping
  useEffect(() => {
    if (!token) setIsBootstrapping(false);
  }, [token]);

  const value = useMemo(() => {
    return {
      token,
      user,
      isBootstrapping,
      async register({ phone, password }) {
        const data = await authApi.register({ phone, password });
        setToken(data.token);
        setTokenState(data.token);
        setUser(data.user);
        return data;
      },
      async login({ phone, password }) {
        const data = await authApi.login({ phone, password });
        setToken(data.token);
        setTokenState(data.token);
        setUser(data.user);
        return data;
      },
      logout() {
        clearToken();
        setTokenState(null);
        setUser(null);
      }
    };
  }, [isBootstrapping, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

