import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BodySelection   from "./pages/BodySelection";
import DoctorAssistant from "./pages/DoctorAssistant";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<Navigate to="/body" replace />} />
        <Route path="/body"   element={<BodySelection />} />
        <Route path="/doctor" element={<DoctorAssistant />} />
      </Routes>
    </BrowserRouter>
  );
}