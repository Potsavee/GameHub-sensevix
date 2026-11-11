import { createContext, useContext, useState } from 'react';
import * as api from '../api/backend';

// Shared account state for navigation, game reviews, wishlist, and profile.
const AuthContext = createContext(null);

const TOKEN_KEY = 'gamereview.token';
const MEMBER_KEY = 'gamereview.member';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [member, setMember] = useState(() =>
    JSON.parse(localStorage.getItem(MEMBER_KEY) || 'null'),
  );

  function remember(data) {
    setToken(data.token);
    setMember(data.member);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(data.member));
  }

  async function login(email, password) {
    const data = await api.login(email, password);
    remember(data);
  }

  async function register(email, password, displayName) {
    await api.register(email, password, displayName);
    await login(email, password);
  }

  function logout() {
    setToken(null);
    setMember(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MEMBER_KEY);
  }

  function updateMember(updates) {
    if (!member) return;

    const updated = { ...member, ...updates };
    setMember(updated);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(updated));
  }

  const isAdmin = member?.role === 'admin';

  const value = {
    token,
    member,
    isLoggedIn: Boolean(token),
    isAdmin,
    login,
    register,
    logout,
    updateMember,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
