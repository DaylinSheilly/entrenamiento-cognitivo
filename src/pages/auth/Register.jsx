import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css"; // Opcional para estilos

const Register = () => {
  const [formData, setFormData] = useState({
    nombre_usuario: "",
    correo_electronico: "",
    contraseña: "",
  });

  const [message, setMessage] = useState(""); // Estado para mensajes de error/éxito
  const [messageType, setMessageType] = useState(""); // "success" o "error"

  const navigate = useNavigate(); // Hook para redirigir

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Limpiar mensaje anterior

    try {
      const response = await axios.post("http://localhost:5000/auth/register", formData);
      console.log("Usuario registrado:", response.data);

      setMessage("Registro exitoso"); // Mensaje de éxito
      setMessageType("success");

      setTimeout(() => navigate("/login"), 2000); // Redirigir después de 2s
    } catch (error) {
      console.error("Error al registrarse:", error.response?.data || error.message);

      setMessage(error.response?.data?.message || "Error desconocido en el servidor");
      setMessageType("error");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>Registro</h2>

        <form onSubmit={handleSubmit}>
          <input type="text" name="nombre_usuario" placeholder="Nombre de usuario" onChange={handleChange} required />
          <input type="email" name="correo_electronico" placeholder="Correo electrónico" onChange={handleChange} required />
          <input type="password" name="contraseña" placeholder="Contraseña" onChange={handleChange} required />
          {/* Mensaje de éxito o error */}
          {message && (
            <div className={`auth-message ${messageType}`}>{message}</div>
          )}
          <button type="submit">Registrarse</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
