import React, { useEffect, useRef, useState } from 'react';
import './atencion.css'

const GAME_TIME = 181; // Duración del juego en segundos

const JuegoAtencion = () => {
  const canvasRef = useRef(null);
  const [puntaje, setPuntaje] = useState(0);
  const [tarjetaActual, setTarjetaActual] = useState(null);
  const [tarjetaAnterior, setTarjetaAnterior] = useState(null);
  const [tiempoRestante, setTiempoRestante] = useState(GAME_TIME);
  const [turnoJugador, setTurnoJugador] = useState(false);
  const [mostrandoPrimeraTarjeta, setMostrandoPrimeraTarjeta] = useState(true);
  const [primerTurno, setPrimerTurno] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [repeticionesRestantes, setRepeticionesRestantes] = useState(0); // Nuevo estado para controlar las repeticiones
  const [colorFondo, setColorFondo] = useState("#abd9f5");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);

  const tiposTarjetas = ["CUADRADO", "CIRCULO", "TRIANGULO", "ESTRELLA"];

  const startCountdown = () => {
    setGameOver(false);
    setGameStarted(false);
    setCountdown(3); // Inicia en 3 segundos
    let timeLeft = 3;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft === 0) {
        clearInterval(interval);
        setCountdown(null);
        startGame(); // Iniciar el juego cuando llega a 0
      }
    }, 1000);
  };

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
    if (!tarjetaAnterior || !tarjetaActual || !turnoJugador || !gameStarted) return;
  
    let nuevoColor;
    let esCorrecto = (esIgual && tarjetaAnterior.tipo === tarjetaActual.tipo) ||
                     (!esIgual && tarjetaAnterior.tipo !== tarjetaActual.tipo);
  
    setTotalAnswers(prev => prev + 1); // Siempre aumenta el total de intentos
  
    if (esCorrecto) {
      setPuntaje(prev => prev + 1);
      setCorrectAnswers(prev => prev + 1); // Aumenta el contador de correctas
      nuevoColor = "#4caf50"; // Verde si acierta
    } else {
      setPuntaje(prev => (prev > 0 ? prev - 1 : 0));
      setTotalErrors(prev => prev + 1); // Aumenta el contador de errores
      nuevoColor = "#ff4c4c"; // Rojo si falla
    }
    // Calcular tiempo de respuesta
    const reactionTime = Date.now() - startTime;
    setReactionTimes(prev => [...prev, reactionTime]); // Guardar el tiempo de reacción
    setStartTime(Date.now()); // Reiniciar el tiempo de inicio para la siguiente ronda
  
    // Cambiar el color de fondo temporalmente
    setColorFondo(nuevoColor);
    setTimeout(() => setColorFondo("#abd9f5"), 500);
  
    // Cambiar tarjeta
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
    if (!canvas) return; // Verifica que canvasRef.current no sea null

    const contexto = canvas.getContext("2d");
    if (tarjetaActual) {
      dibujarTarjeta(contexto, tarjetaActual.tipo, 350, 250, colorFondo);
    }
  }, [tarjetaActual, mostrandoPrimeraTarjeta, colorFondo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Verifica que canvasRef.current no sea null

    const contexto = canvas.getContext("2d");

    if (tarjetaAnterior && mostrandoPrimeraTarjeta) {
      dibujarTarjeta(contexto, tarjetaAnterior.tipo, 350, 250, colorFondo);

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
  }, [tarjetaAnterior, mostrandoPrimeraTarjeta, primerTurno, colorFondo]);

  useEffect(() => {
    setTarjetaAnterior(elegirTarjetaAleatoria());
  }, []);

  const startGame = () => {
    setGameOver(false);
    setGameStarted(true);
  
    setTimeout(() => {
      setPuntaje(0);
      setTiempoRestante(GAME_TIME); 
      setTarjetaAnterior(elegirTarjetaAleatoria());
      setTarjetaActual(null); // Se inicializa en null antes de la primera elección
      setMostrandoPrimeraTarjeta(true);
      setPrimerTurno(true);
      setTurnoJugador(false);
      setRepeticionesRestantes(0); // Reinicia el contador de repeticiones
      setColorFondo("#abd9f5"); // Restablece el color de fondo
      setCorrectAnswers(0);
      setTotalAnswers(0);
      setTotalErrors(0);
      setCountdown(null); // Elimina cualquier cuenta regresiva previa
      setReactionTimes([]); // Reinicia los tiempos de reacción
    }, 100);
  };

  const formatearTiempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  const dibujarTarjeta = (contexto, tipo, x, y, colorFondo = "#abd9f5") => {
    const canvas = contexto.canvas;
    const centroX = canvas.width / 2;
    const centroY = canvas.height / 2;

    // Limpia el canvas antes de dibujar
    contexto.clearRect(0, 0, canvas.width, canvas.height);

    // Color de fondo del canvas
    contexto.fillStyle = colorFondo;
    contexto.fillRect(0, 0, canvas.width, canvas.height);

    switch (tipo) {
      case "CUADRADO":
        contexto.fillStyle = "#3498db";
        contexto.fillRect(centroX - 50, centroY - 50, 100, 100);
        contexto.strokeStyle = "#2980b9";
        contexto.lineWidth = 4;
        contexto.strokeRect(centroX - 50, centroY - 50, 100, 100);
        break;

      case "CIRCULO":
        contexto.fillStyle = "#e74c3c";
        contexto.beginPath();
        contexto.arc(centroX, centroY, 50, 0, Math.PI * 2);
        contexto.fill();
        contexto.strokeStyle = "#c0392b";
        contexto.lineWidth = 4;
        contexto.stroke();
        break;

      case "TRIANGULO":
        contexto.fillStyle = "#f1c40f";
        contexto.beginPath();
        contexto.moveTo(centroX, centroY - 50);
        contexto.lineTo(centroX - 50, centroY + 50);
        contexto.lineTo(centroX + 50, centroY + 50);
        contexto.closePath();
        contexto.fill();
        contexto.strokeStyle = "#f39c12";
        contexto.lineWidth = 4;
        contexto.stroke();
        break;

      case "ESTRELLA":
        const radioInterior = 30;
        const radioExterior = 50;
        contexto.fillStyle = "#9b59b6";
        contexto.beginPath();

        for (let i = 0; i < 5; i++) {
          const anguloExterior = (i * (Math.PI / 2.5)) - (Math.PI / 2);
          const anguloInterior = ((i + 1) * (Math.PI / 2.5)) - (Math.PI / 2);

          const xExterior = centroX + Math.cos(anguloExterior) * radioExterior;
          const yExterior = centroY + Math.sin(anguloExterior) * radioExterior;
          const xInterior = centroX + Math.cos(anguloInterior) * radioInterior;
          const yInterior = centroY + Math.sin(anguloInterior) * radioInterior;

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
    if (gameStarted) {
      if (tiempoRestante === null) {
        // Primera pantalla, no se inicia el temporizador
        setTimeout(() => setTiempoRestante(GAME_TIME), 1000);
      } else if (tiempoRestante > 0) {
        timer = setInterval(() => {
          setTiempoRestante((prev) => {
            if (prev <= 1) {
              setGameOver(true);
              setGameStarted(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStarted, tiempoRestante]);

  const calculateReactionTime = () => {
    console.log("Calculando tiempo de reacción...");

    if (!reactionTimes || reactionTimes.length === 0) {
      console.log("No hay tiempos de reacción registrados.");
      return 0;
    }

    // Filtrar valores no numéricos o inválidos
    const validTimes = reactionTimes.filter(time => typeof time === "number" && !isNaN(time));
    console.log("Tiempos válidos:", validTimes);

    if (validTimes.length === 0) {
      console.log("No hay tiempos de reacción válidos.");
      return 0;
    }

    const sum = validTimes.reduce((acc, time) => acc + time, 0);
    const average = parseFloat((sum / validTimes.length).toFixed(2));

    console.log(`Suma total: ${sum}, Cantidad: ${validTimes.length}, Promedio: ${average}`);

    return average;
  };

  return (
    <div className="attention-game-container">
      {gameOver ? (
        <div className="attention-fin-juego-container">
          <h1>Fin del juego</h1>
          <p>🕒 Tiempo total de juego: {GAME_TIME-1} segundos</p>
          <p>🏅 <strong>Puntaje final:</strong> {puntaje}</p>
          <p>✅ Correctas: {correctAnswers} de {totalAnswers}</p>
          <p>❌ Errores: {totalErrors}</p>
          <p>📊 Precisión: {totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : "0"}%</p>
          <p>🕒 Tiempo de reacción: {(calculateReactionTime() / 1000).toFixed(2)} s</p>
          <button onClick={startCountdown}>
            Jugar de nuevo
          </button>
        </div>
      ) : !gameStarted ? (
        countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
          <div className="attention-start-screen">
            <h2>¡Bienvenido a Juego de atención!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="attention-countdown">{countdown}</div>
        )
      ) : (
        <>
          <div className="attention-game-app">
            <canvas
              ref={canvasRef}
              width="300"
              height="300"
            />
            <div className="attention-botones-contenedor">
              <button
                onClick={() => manejarClic(true)}
                disabled={!turnoJugador || !gameStarted} // Bloqueo adicional
              >
                Igual
              </button>
              <button
                onClick={() => manejarClic(false)}
                disabled={!turnoJugador || !gameStarted} // Bloqueo adicional
              >
                Diferente
              </button>
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
        </>
      )}
    </div>
  );

};

export default JuegoAtencion;
