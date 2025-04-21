import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("neurogames_token"));
  const [user, setUser] = useState(() => {
    const data = localStorage.getItem("userData");
    return data ? JSON.parse(data) : null;
  });

  useEffect(() => {
    // Sync with localStorage changes (in case of manual clearing or multiple tabs)
    const syncAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("neurogames_token"));
      const data = localStorage.getItem("userData");
      setUser(data ? JSON.parse(data) : null);
    };
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("neurogames_token", token);
    localStorage.setItem("userData", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("neurogames_token");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
