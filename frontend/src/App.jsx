import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import AuthPage from "./features/auth/AuthPage.jsx";
import LobbyPage from "./features/lobby/LobbyPage.jsx";
import JoinByLink from "./features/join/JoinByLink.jsx";
import LandscapeGuard from "./components/LandscapeGuard.jsx";

export default function App() {
  const { isBootstrapping, token } = useAuth();

  if (isBootstrapping) return null;

  return (
    <>
      <LandscapeGuard />
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <AuthPage />}
        />
        <Route
          path="/join"
          element={token ? <JoinByLink /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={token ? <LobbyPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
