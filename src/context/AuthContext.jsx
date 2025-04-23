// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("neurogames_token"));
  const [user, setUser] = useState(() => {
    const data = localStorage.getItem("userData");
    return data ? JSON.parse(data) : null;
  });
  const [token, setToken] = useState(localStorage.getItem("neurogames_token") || null); // Nuevo estado

  const login = (newToken, userData) => {
    localStorage.setItem("neurogames_token", newToken);
    localStorage.setItem("userData", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    setToken(newToken); // Actualizar estado del token
  };

  const logout = () => {
    localStorage.removeItem("neurogames_token");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
    setUser(null);
    setToken(null); // Limpiar estado del token
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
