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

  const isAdmin = () => user && ['admin_etablissement', 'admin_groupe'].includes(user.role_global);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>;

  return (
    <AuthContext.Provider value={{ user, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
