import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import AuthPage from "./features/auth/AuthPage.jsx";
import HomePlaceholder from "./features/home/HomePlaceholder.jsx";

export default function App() {
  const { isBootstrapping, token } = useAuth();

  if (isBootstrapping) return null;

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/"
        element={token ? <HomePlaceholder /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
