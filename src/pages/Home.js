// Home.js
import React, { useEffect, useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    if (token) {
      axios.get("http://localhost:5000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        setIsAuthenticated(true);
        setUserData(response.data);
      })
      .catch(error => {
        console.error("Error al obtener datos del usuario:", error);
        setIsAuthenticated(false);
      });
    }
  }, []);

  const handleLogout = () => {
    console.log("Cerrando sesión...");
    localStorage.removeItem('token'); // Eliminar token
    localStorage.removeItem('userData'); // Eliminar datos del usuario
    setIsAuthenticated(false); // Actualizar estado
    setUserData(null);
    navigate('/'); // Redirigir a la página principal
  };

  return (
    <div className="home-body">
      <div className="home-container">
        <h1>Bienvenido a la Plataforma de Juegos</h1>

        {isAuthenticated && userData ? (
          <div className="user-info">
            <h2>Datos del Usuario</h2>
            <p><strong>ID:</strong> {userData.id_usuario}</p>
            <p><strong>Nombre:</strong> {userData.nombre_usuario}</p>
            <p><strong>Correo:</strong> {userData.correo_electronico}</p>
            <p><strong>Fecha de Registro:</strong> {userData.fecha_registro}</p>
            <p><strong>Estado de Cuenta:</strong> {userData.estado_cuenta ? "Activo" : "Inactivo"}</p>
          </div>
        ) : (
          <p>No has iniciado sesión.</p>
        )}

        <div className="home-buttons">
          <button onClick={() => navigate('/games')}>Games</button>
          <button onClick={() => navigate('/dashboard')}>Dashboard</button>

          {isAuthenticated ? (
            <button onClick={handleLogout}>Cerrar Sesión</button>
          ) : (
            <>
              <button onClick={() => navigate('/register')}>Registrarse</button>
              <button onClick={() => navigate('/login')}>Iniciar Sesión</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
