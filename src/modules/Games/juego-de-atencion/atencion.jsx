import React, { useEffect, useRef, useState } from 'react';
import './atencion.css'

const JuegoAtencion = () => {
  const canvasRef = useRef(null);
  const [puntaje, setPuntaje] = useState(0);
  const [tarjetaActual, setTarjetaActual] = useState(null);
  const [tarjetaAnterior, setTarjetaAnterior] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(181);
  const [turnoJugador, setTurnoJugador] = useState(false);
  const [mostrandoPrimeraTarjeta, setMostrandoPrimeraTarjeta] = useState(true);
  const [primerTurno, setPrimerTurno] = useState(true);
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [juegoActivo, setJuegoActivo] = useState(true);
  const [repeticionesRestantes, setRepeticionesRestantes] = useState(0); // Nuevo estado para controlar las repeticiones

  const tiposTarjetas = ["CUADRADO", "CIRCULO", "TRIANGULO", "ESTRELLA"];

  const generarNumeroAleatorio = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const elegirTarjetaAleatoria = () => {
    if (repeticionesRestantes > 0) {
      // Imprimir en consola cuántas veces se va a repetir la figura
      console.log(`La figura ${tarjetaActual.tipo} se repetirá ${repeticionesRestantes} vez/veces más.`);
      setRepeticionesRestantes(repeticionesRestantes - 1);
      return tarjetaActual; // Mantener la misma figura mientras haya repeticiones
    }

    const nuevaTarjeta = {
      tipo: tiposTarjetas[Math.floor(Math.random() * tiposTarjetas.length)],
    };

    setRepeticionesRestantes(generarNumeroAleatorio(1, 5) - 1); // Generar nuevas repeticiones
    return nuevaTarjeta;
  };

  const manejarClic = (esIgual) => {
    if (!tarjetaAnterior || !tarjetaActual || !turnoJugador || !juegoActivo) return;

    if ((esIgual && tarjetaAnterior.tipo === tarjetaActual.tipo) ||
        (!esIgual && tarjetaAnterior.tipo !== tarjetaActual.tipo)) {
      setPuntaje(puntaje + 1);
    } else {
      if (puntaje > 0) setPuntaje(puntaje - 1);
    }

    setTarjetaAnterior(tarjetaActual);
    setTarjetaActual(elegirTarjetaAleatoria());
    setMostrandoPrimeraTarjeta(true);
    setTurnoJugador(false);
  };

  useEffect(() => {
    const tarjetaInicial = elegirTarjetaAleatoria();
    setTarjetaAnterior(tarjetaInicial);
    setTarjetaActual(tarjetaInicial);
  }, []);  

  useEffect(() => {
    const canvas = canvasRef.current;
  
    if (canvas) {
      const contexto = canvas.getContext("2d");
      if (tarjetaActual) {
        dibujarTarjeta(contexto, tarjetaActual.tipo, 350, 250);
      }
    }
  }, [tarjetaActual, mostrandoPrimeraTarjeta]);
  
  

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
        }, 1000);
      } else {
        setTarjetaActual(elegirTarjetaAleatoria());
        setMostrandoPrimeraTarjeta(false);
        setTurnoJugador(true);
      }
    }
  }, [tarjetaAnterior, mostrandoPrimeraTarjeta, primerTurno]);

  useEffect(() => {
    setTarjetaAnterior(elegirTarjetaAleatoria());
  }, []);

  const reiniciarJuego = () => {
    setJuegoActivo(false);
    setTimeout(() => {
      setPuntaje(0);
      setTiempoRestante(180);
      setJuegoTerminado(false);
      setJuegoActivo(true);
      setTarjetaAnterior(elegirTarjetaAleatoria());
      setMostrandoPrimeraTarjeta(true);
      setPrimerTurno(true);
      setTurnoJugador(false);
    }, 100);
  };

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  const dibujarTarjeta = (contexto, tipo, x, y) => {
    contexto.clearRect(0, 0, 800, 600); // Limpia el canvas antes de dibujar
  
    // Color de fondo del canvas
    contexto.fillStyle = "#1e1e1e";
    contexto.fillRect(0, 0, 800, 600);
  
    switch (tipo) {
      case "CUADRADO":
        contexto.fillStyle = "#3498db"; 
        contexto.fillRect(x, y, 100, 100);
        contexto.strokeStyle = "#2980b9";
        contexto.lineWidth = 4;
        contexto.strokeRect(x, y, 100, 100);
        break;
  
      case "CIRCULO":
        contexto.fillStyle = "#e74c3c";
        contexto.beginPath();
        contexto.arc(x + 50, y + 50, 50, 0, Math.PI * 2);
        contexto.fill();
        contexto.strokeStyle = "#c0392b";
        contexto.lineWidth = 4;
        contexto.stroke();
        break;
  
      case "TRIANGULO":
        contexto.fillStyle = "#f1c40f";
        contexto.beginPath();
        contexto.moveTo(x + 50, y);
        contexto.lineTo(x, y + 100);
        contexto.lineTo(x + 100, y + 100);
        contexto.closePath();
        contexto.fill();
        contexto.strokeStyle = "#f39c12";
        contexto.lineWidth = 4;
        contexto.stroke();
        break;
  
      case "ESTRELLA":
        const estrellaX = x + 50;
        const estrellaY = y + 60;
        const radioInterior = 30;
        const radioExterior = 50;
  
        contexto.fillStyle = "#9b59b6";
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
        contexto.strokeStyle = "#8e44ad";
        contexto.lineWidth = 4;
        contexto.stroke();
        break;
  
      default:
        break;
    }
  };
  

  useEffect(() => {
    let timer;
    if (juegoActivo && tiempoRestante > 0) {
      timer = setInterval(() => {
        setTiempoRestante((prev) => {
          if (prev <= 1) {
            // Final del juego
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
  

  return (
    <div className="attention-body">
      {juegoTerminado ? (
        <div className="attention-fin-juego">
          <attention-h1>¡Juego Terminado!</attention-h1>
          <attention-p>Puntaje final: {puntaje}</attention-p>
          <attention-button onClick={reiniciarJuego} className="attention-reiniciar-button">
            Volver a jugar
          </attention-button>
        </div>
      ) : (
        <div className="attention-juego-contenedor">
          <attention-h1>Juego de Atención</attention-h1>
          <canvas 
            ref={canvasRef} 
            width="800" 
            height="600"
          />
          <div className="attention-botones-contenedor">
            <attention-button 
              onClick={() => manejarClic(true)} 
              disabled={!turnoJugador || !juegoActivo} // Bloqueo adicional
            >
              Igual
            </attention-button>
            <attention-button 
              onClick={() => manejarClic(false)} 
              disabled={!turnoJugador || !juegoActivo} // Bloqueo adicional
            >
              Diferente
            </attention-button>
          </div>
          <div className="attention-marcadores">
            <div className="attention-marcador-item">
              Puntaje: {puntaje}
            </div>
            <div className="attention-marcador-item">
              Tiempo: {formatearTiempo(tiempoRestante)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default JuegoAtencion;
