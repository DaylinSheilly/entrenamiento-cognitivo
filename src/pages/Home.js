import React, { useEffect, useState } from 'react';
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("neurogames_token");

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

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("neurogames_token");
      
      // Cerrar sesión en el backend
      if (token) {
        await axios.put('http://localhost:5000/sessions/end', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      // Limpiar frontend
      localStorage.removeItem('neurogames_token');
      localStorage.removeItem('userData');
      localStorage.removeItem('currentSession'); // Si lo estás almacenando
      setIsAuthenticated(false);
      setUserData(null);
      navigate('/');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.")) {
        return;
    }

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("No estás autenticado.");
            return;
        }

        await axios.delete("http://localhost:5000/auth/delete", {
            headers: { Authorization: `Bearer ${token}` },
            data: {} // Solución para algunos servidores Express que no manejan bien el cuerpo en DELETE
        });

        alert("Cuenta eliminada correctamente.");
        handleLogout(); // Cierra la sesión después de eliminar la cuenta
    } catch (error) {
        console.error("Error al eliminar la cuenta:", error);
        alert(error.response?.data?.message || "Hubo un error al eliminar tu cuenta.");
    }
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
          {isAuthenticated ? (
            <>
              <button onClick={() => navigate('/games')}>Games</button>
              <button onClick={() => navigate('/dashboard')}>Dashboard</button>
              <button onClick={handleLogout}>Cerrar Sesión</button>
              <button onClick={handleDeleteAccount} style={{ backgroundColor: 'red', color: 'white' }}>
                Eliminar Cuenta
              </button>
            </>
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
