import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Opcional para estilos

const Login = () => {
  const [formData, setFormData] = useState({
    correo_electronico: "",
    contraseña: "",
  });

  const [message, setMessage] = useState(""); // Estado para mensajes de error/éxito
  const [messageType, setMessageType] = useState(""); // "success" o "error"

  const navigate = useNavigate(); // Hook de navegación

  // Manejar cambios en los inputs del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Limpiar mensaje anterior

    try {
      // Llamada al backend para iniciar sesión
      const response = await axios.post("http://localhost:5000/auth/login", formData);
      console.log("Respuesta del backend:", response.data);

      if (response.data.token) {
        // Guardar el token con un nombre más específico
        localStorage.setItem("neurogames_token", response.data.token);
        
        // Guardar datos del usuario
        localStorage.setItem("userData", JSON.stringify(response.data.user));

        setMessage("Inicio de sesión exitoso"); // Mensaje de éxito
        setMessageType("success");

        // Redirigir al usuario después de un pequeño retraso
        setTimeout(() => navigate("/home"), 1000);
      } else {
        setMessage("Error: No se recibió el token");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error.response?.data || error.message);

      // Capturar y mostrar el mensaje de error del backend
      setMessage(error.response?.data?.message || "Error desconocido en el servidor");
      setMessageType("error");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Iniciar sesión</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="correo_electronico"
            placeholder="Correo electrónico"
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="contraseña"
            placeholder="Contraseña"
            onChange={handleChange}
            required
          />
          {/* Mensaje de éxito o error */}
          {message && (
            <div className={`auth-message ${messageType}`}>{message}</div>
          )}
          <button type="submit">Ingresar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
