import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import BodySelection from "./pages/BodySelection";
import DoctorAssistant from "./pages/DoctorAssistant";
import DietRecommendation from "./pages/DietRecommendation";
import HealthDashboard from "./pages/HealthDashboard";
import AppointmentPage from "./pages/AppointmentPage";

// ── Auth guard — redirects to /login if not signed in ─────────────────────────
function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />

      {/* Root → redirect based on auth */}
      <Route path="/" element={<Navigate to={user ? "/home" : "/login"} replace />} />

      {/* Protected */}
      <Route path="/home" element={<Protected><HomePage /></Protected>} />
      <Route path="/body" element={<Protected><BodySelection /></Protected>} />
      <Route path="/doctor" element={<Protected><DoctorAssistant /></Protected>} />
      <Route path="/diet" element={<Protected><DietRecommendation /></Protected>} />
      <Route path="/dashboard" element={<Protected><HealthDashboard /></Protected>} />
      <Route path="/appointments" element={<Protected><AppointmentPage /></Protected>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}