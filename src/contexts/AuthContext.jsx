import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      localStorage.setItem('sso_token', urlToken);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const token = localStorage.getItem('sso_token');
    if (!token) {
      window.location.href = '/';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch {
      window.location.href = '/';
      return;
    }
    setLoading(false);
  }, []);

  const VERIFS_APP_ID = '61c0eb5c-480d-4d68-b6c5-4e8b29595f6d';
  const isAdmin = () => user && ['admin_etablissement', 'admin_groupe'].includes(user.role_global);
  const isManager = () => {
    if (isAdmin()) return true;
    const app = (user?.apps || []).find(a => a.id === VERIFS_APP_ID);
    return app && ['gestionnaire', 'admin'].includes(app.role);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;

  return (
    <AuthContext.Provider value={{ user, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
