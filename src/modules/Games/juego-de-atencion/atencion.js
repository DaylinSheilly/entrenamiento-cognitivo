import React, { useEffect, useRef, useState } from 'react';

const JuegoAtencion = () => {
  const canvasRef = useRef(null);
  const [puntaje, setPuntaje] = useState(0);
  const [tarjetaActual, setTarjetaActual] = useState(null);
  const [tarjetaAnterior, setTarjetaAnterior] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(5); // 3 minutos
  const [turnoJugador, setTurnoJugador] = useState(false);
  const [mostrandoPrimeraTarjeta, setMostrandoPrimeraTarjeta] = useState(true);
  const [primerTurno, setPrimerTurno] = useState(true);
  const [juegoTerminado, setJuegoTerminado] = useState(false); // Controla si el juego ha terminado

  const tiposTarjetas = ["CUADRADO", "CIRCULO", "TRIANGULO", "ESTRELLA"];

  const dibujarTarjeta = (contexto, tipo, x, y) => {
    contexto.clearRect(0, 0, 800, 600);
    contexto.fillStyle = "#FFFFFF";

    switch (tipo) {
      case "CUADRADO":
        contexto.fillRect(x, y, 100, 100);
        break;
      case "CIRCULO":
        contexto.beginPath();
        contexto.arc(x + 50, y + 50, 50, 0, 2 * Math.PI);
        contexto.fill();
        break;
      case "TRIANGULO":
        contexto.beginPath();
        contexto.moveTo(x + 50, y);
        contexto.lineTo(x, y + 100);
        contexto.lineTo(x + 100, y + 100);
        contexto.closePath();
        contexto.fill();
        break;
      case "ESTRELLA":
        contexto.fillText("★", x + 45, y + 80);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev > 0) return prev - 1;
        clearInterval(timer);
        setJuegoTerminado(true); // El juego se termina cuando el tiempo llega a 0
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    if (!tarjetaAnterior || !tarjetaActual || !turnoJugador) return;

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

  // Función para reiniciar el juego
  const reiniciarJuego = () => {
    setPuntaje(0);
    setTiempoRestante(180); // Reiniciar el tiempo
    setJuegoTerminado(false); // Quitar el estado de juego terminado
    setTarjetaAnterior(elegirTarjetaAleatoria());
    setMostrandoPrimeraTarjeta(true);
    setPrimerTurno(true);
    setTurnoJugador(false);
  };

  return (
    <div>
      {juegoTerminado ? (
        <div>
          <h1>¡Felicidades! Has terminado el juego.</h1>
          <p>Tu puntaje final fue: {puntaje}</p>
          <button onClick={reiniciarJuego}>Reiniciar juego</button>
        </div>
      ) : (
        <div>
          <canvas ref={canvasRef} width="800" height="600" style={{ border: "1px solid black" }}></canvas>
          <div>
            <button onClick={() => manejarClic(true)} disabled={!turnoJugador}>Igual</button>
            <button onClick={() => manejarClic(false)} disabled={!turnoJugador}>Diferente</button>
          </div>
          <div>Puntaje: {puntaje}</div>
          <div>Tiempo restante: {tiempoRestante}s</div>
        </div>
      )}
    </div>
  );
};

export default JuegoAtencion;
