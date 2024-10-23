import React, { useEffect, useRef, useState } from 'react';
import './atencion.css'

const JuegoAtencion = () => {
    const canvasRef = useRef(null);
    const [puntaje, setPuntaje] = useState(0);
    const [tarjetaActual, setTarjetaActual] = useState(null);
    const [tarjetaAnterior, setTarjetaAnterior] = useState(null);
    const [tiempoRestante, setTiempoRestante] = useState(5);
    const [turnoJugador, setTurnoJugador] = useState(false);
    const [mostrandoPrimeraTarjeta, setMostrandoPrimeraTarjeta] = useState(true);
    const [primerTurno, setPrimerTurno] = useState(true);
    const [juegoTerminado, setJuegoTerminado] = useState(false);
    const [juegoActivo, setJuegoActivo] = useState(true);
  
    const tiposTarjetas = ["CUADRADO", "CIRCULO", "TRIANGULO", "ESTRELLA"];
  
    const dibujarTarjeta = (contexto, tipo, x, y) => {
        contexto.clearRect(0, 0, 800, 600);
      
        // Establecer el color de fondo
        contexto.fillStyle = "#1e1e1e"; // Color de fondo del canvas
        contexto.fillRect(0, 0, 800, 600); // Llenar el fondo
      
        // Establecer estilos para las figuras
        contexto.shadowColor = "rgba(0, 0, 0, 0.5)";
        contexto.shadowBlur = 10;
        contexto.shadowOffsetX = 5;
        contexto.shadowOffsetY = 5;
      
        switch (tipo) {
          case "CUADRADO":
            contexto.fillStyle = "#3498db"; // Color del cuadrado
            contexto.fillRect(x, y, 100, 100);
            contexto.strokeStyle = "#2980b9"; // Color del borde
            contexto.lineWidth = 4;
            contexto.strokeRect(x, y, 100, 100);
            break;
      
          case "CIRCULO":
            contexto.fillStyle = "#e74c3c"; // Color del círculo
            contexto.beginPath();
            contexto.arc(x + 50, y + 50, 50, 0, Math.PI * 2);
            contexto.fill();
            contexto.strokeStyle = "#c0392b"; // Color del borde
            contexto.lineWidth = 4;
            contexto.stroke();
            break;
      
          case "TRIANGULO":
            contexto.fillStyle = "#f1c40f"; // Color del triángulo
            contexto.beginPath();
            contexto.moveTo(x + 50, y);
            contexto.lineTo(x, y + 100);
            contexto.lineTo(x + 100, y + 100);
            contexto.closePath();
            contexto.fill();
            contexto.strokeStyle = "#f39c12"; // Color del borde
            contexto.lineWidth = 4;
            contexto.stroke();
            break;
      
          case "ESTRELLA":
            const estrellaX = x + 50;
            const estrellaY = y + 60;
            const radioInterior = 30;
            const radioExterior = 50;
      
            contexto.fillStyle = "#9b59b6"; // Color de la estrella
            contexto.beginPath();
            
            for (let i = 0; i < 5; i++) {
              const anguloExterior = (i * (Math.PI / 2.5)) - (Math.PI / 2);
              const anguloInterior = ((i + 1) * (Math.PI / 2.5)) - (Math.PI / 2);
              
              const xExterior = estrellaX + Math.cos(anguloExterior) * radioExterior;
              const yExterior = estrellaY + Math.sin(anguloExterior) * radioExterior;
              const xInterior = estrellaX + Math.cos(anguloInterior) * radioInterior;
              const yInterior = estrellaY + Math.sin(anguloInterior) * radioInterior;
      
              if (i === 0) {
                contexto.moveTo(xExterior, yExterior);
              } else {
                contexto.lineTo(xExterior, yExterior);
              }
              contexto.lineTo(xInterior, yInterior);
            }
            
            contexto.closePath();
            contexto.fill();
            
            // Borde para la estrella
            contexto.strokeStyle = "#8e44ad"; // Color del borde
            contexto.lineWidth = 4;
            contexto.stroke();
            
            break;
      
          default:
            break;
        }
      
        // Resetear sombras después de dibujar la figura
        contexto.shadowColor = "transparent";
      };
  
    useEffect(() => {
      let timer;
      if (juegoActivo && tiempoRestante > 0) {
        timer = setInterval(() => {
          setTiempoRestante((prev) => {
            if (prev <= 1) {
              setJuegoTerminado(true);
              setJuegoActivo(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
  
      return () => {
        if (timer) {
          clearInterval(timer);
        }
      };
    }, [juegoActivo, tiempoRestante]);
  
    useEffect(() => {
      const canvas = canvasRef.current;
      const contexto = canvas.getContext("2d");
  
      if (tarjetaActual) {
        dibujarTarjeta(contexto, tarjetaActual.tipo, 350, 250);
      }
    }, [tarjetaActual]);
  
    useEffect(() => {
      const canvas = canvasRef.current;
      const contexto = canvas.getContext("2d");
  
      if (tarjetaAnterior && mostrandoPrimeraTarjeta) {
        dibujarTarjeta(contexto, tarjetaAnterior.tipo, 350, 250);
  
        if (primerTurno) {
          setTimeout(() => {
            setTarjetaActual(elegirTarjetaAleatoria());
            setMostrandoPrimeraTarjeta(false);
            setTurnoJugador(true);
            setPrimerTurno(false);
          }, 1500);
        } else {
          setTarjetaActual(elegirTarjetaAleatoria());
          setMostrandoPrimeraTarjeta(false);
          setTurnoJugador(true);
        }
      }
    }, [tarjetaAnterior, mostrandoPrimeraTarjeta, primerTurno]);
  
    const manejarClic = (esIgual) => {
      if (!tarjetaAnterior || !tarjetaActual || !turnoJugador || !juegoActivo) return;
  
      if ((esIgual && tarjetaAnterior.tipo === tarjetaActual.tipo) ||
          (!esIgual && tarjetaAnterior.tipo !== tarjetaActual.tipo)) {
        setPuntaje(puntaje + 1);
      } else {
        if (puntaje > 0) setPuntaje(puntaje - 1);
      }
  
      setTarjetaAnterior(tarjetaActual);
      setMostrandoPrimeraTarjeta(true);
      setTurnoJugador(false);
    };
  
    const elegirTarjetaAleatoria = () => {
      const tipo = tiposTarjetas[Math.floor(Math.random() * tiposTarjetas.length)];
      return { tipo };
    };
  
    useEffect(() => {
      setTarjetaAnterior(elegirTarjetaAleatoria());
    }, []);
  
    const reiniciarJuego = () => {
      setPuntaje(0);
      setTiempoRestante(180);
      setJuegoTerminado(false);
      setJuegoActivo(true); 
      setTarjetaAnterior(elegirTarjetaAleatoria());
      setMostrandoPrimeraTarjeta(true);
      setPrimerTurno(true);
      setTurnoJugador(false);
    };
  
    const formatearTiempo = (segundos) => {
      const minutos = Math.floor(segundos / 60);
      const segundosRestantes = segundos % 60;
      return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`;
    };
  
    return (
      <div className="juego-contenedor">
        <h1>Juego de Atención</h1>
        {juegoTerminado ? (
          <div className="fin-juego">
            <h1>¡Felicidades! Has terminado el juego.</h1>
            <p>Tu puntaje final fue: {puntaje}</p>
            <button onClick={reiniciarJuego}>Reiniciar juego</button>
          </div>
        ) : (
          <div>
            <canvas 
              ref={canvasRef} 
              width="800" 
              height="600"
            />
            <div className="botones-contenedor">
              <button 
                onClick={() => manejarClic(true)} 
                disabled={!turnoJugador}
              >
                Igual
              </button>
              <button 
                onClick={() => manejarClic(false)} 
                disabled={!turnoJugador}
              >
                Diferente
              </button>
            </div>
            <div className="marcadores">
              <div className="marcador-item">
                Puntaje: {puntaje}
              </div>
              <div className="marcador-item">
                Tiempo: {formatearTiempo(tiempoRestante)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  export default JuegoAtencion;