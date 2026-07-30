import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import DashboardPage from './pages/DashboardPage';
import ExecutionPage from './pages/ExecutionPage';
import AdminVerifsPage from './pages/AdminVerifsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/verifs">
        <Toaster position="bottom-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/execution/:id" element={<ExecutionPage />} />
          <Route path="/admin" element={<AdminVerifsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
