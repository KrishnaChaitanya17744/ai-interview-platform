// client/src/context/AuthContext.jsx

import React, {
  createContext, useContext, useState,
  useEffect, useCallback,
} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Load saved auth on app start ──────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser  = localStorage.getItem('authUser');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }

    setLoading(false);
  }, []);

  // ── Login — save to state + localStorage ──────────────
  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
  }, []);

  // ── Logout — clear cookie (server) + local state ───────
  const logout = useCallback(async () => {
    try {
      const { logoutUser } = await import('../services/api');
      await logoutUser();
    } catch {
      /* best-effort server cookie clear */
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ── Custom hook ───────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};

export default AuthContext;