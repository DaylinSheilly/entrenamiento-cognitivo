import React, { useState, useEffect, useRef } from "react";
import "./color-accion.css";

const directions = ["up", "down", "left", "right"];
const CIRCLE_SIZE = 100; // Tamaño de la caja de colisión de cada círculo
const BOARD_SIZE = 600;  // Tamaño del contenedor (600px x 600px)

// Funciones utilitarias para obtener valores aleatorios
const getRandomDirection = () =>
  directions[Math.floor(Math.random() * directions.length)];
const getRandomColor = () => (Math.random() > 0.5 ? "yellow" : "green");

const ConcentrarseEnElObjetivo = ({ onGameEnd }) => {
  // Estados del juego
  const [circles, setCircles] = useState([]);
  const [score, setScore] = useState(50);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [stars, setStars] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45); // en segundos
  const [totalTime, setTotalTime] = useState(45);
  const [currentDirection, setCurrentDirection] = useState(getRandomDirection());
  const [arrowDirection, setArrowDirection] = useState(getRandomDirection());
  // Dificultad: velocidad (step), cantidad de círculos y contraste de la flecha
  const [difficulty, setDifficulty] = useState({
    speed: 3,
    numCircles: 6,
    arrowContrast: 1,
  });
  const [totalCards, setTotalCards] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [errors, setErrors] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const FAST_THRESHOLD = 250; // milisegundos (ajusta si quieres otro umbral)
  const [lastKeyTime, setLastKeyTime] = useState(null);
  const isHandlingGameEnd = useRef(false);

  const gameData = {
    game_name: "Color y acción",
    level: Math.max(1, Math.floor(stars / 2)),
    difficulty: "N/A",
    actions_taken: totalCards, // Total de acciones realizadas
    accuracy: totalCards > 0 ? parseFloat(((correctAnswers / totalCards) * 100).toFixed(2)) : 0,
    streaks: consecutiveCorrect,
    errors: errors,
    score: score,
  };

  const handleGameEnd = () => {
    if (!gameOver || !gameStarted) return;
    // Envía los datos al GameLayout
    // console.log("Datos del juego:", gameData);
    onGameEnd(gameData);
  };

  useEffect(() => {
    if (gameOver && gameStarted && !isHandlingGameEnd.current) {
      isHandlingGameEnd.current = true;
      handleGameEnd();
      setTimeout(() => {
        setGameStarted(false);
        isHandlingGameEnd.current = false;
      }, 1000);
    }
  }, [gameOver, gameStarted]);

  // Timer: cuenta regresiva de 45 segundos
  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameStarted && timeLeft === 0) {
      setGameOver(true);
    }
  }, [timeLeft, gameStarted]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      setLastKeyTime(performance.now());
    }
    // Solo cuando empieza una nueva ronda
  }, [circles]);

  // Ajuste de dificultad conforme pasa el tiempo
  useEffect(() => {
    if (timeLeft <= 0) {
      setDifficulty({ speed: 4, numCircles: 6, arrowContrast: 1 });
    } else if (timeLeft <= 15) {
      setDifficulty({ speed: 8, numCircles: 10, arrowContrast: 0.2 });
    } else if (timeLeft <= 30) {
      setDifficulty({ speed: 6, numCircles: 8, arrowContrast: 0.5 });
    } else {
      setDifficulty({ speed: 4, numCircles: 6, arrowContrast: 1 });
    }
  }, [timeLeft]);

  const startGame = () => {
    setTimeLeft(45);
    setDifficulty({
      speed: 3,
      numCircles: 6,
      arrowContrast: 1,
    });
    setCircles([]);
    setScore(50);
    setConsecutiveCorrect(0);
    setStars(0);
    setCurrentDirection(getRandomDirection());
    setArrowDirection(getRandomDirection());
    setTotalCards(0);
    setCorrectAnswers(0);
    setErrors(0);
    setTotalTime(45);
    setGameStarted(true);
    setGameOver(false);
    setCountdown(null);
    setReactionTimes([]);
    setLastKeyTime(null);

    isHandlingGameEnd.current = false;

    generateCircles();
  };

  const startCountdown = () => {
    setGameStarted(false);
    setGameOver(false);
    setCountdown(3); // Resetear a 3

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          startGame(); // Iniciar juego
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Genera una posición aleatoria dentro del contenedor, evitando superposiciones
  const generateRandomPosition = (existingPositions) => {
    let newPos;
    let overlap;
    do {
      // Se asegura que la posición esté entre 100 y (BOARD_SIZE - 100) para evitar que aparezca ya fuera
      newPos = {
        top:
          Math.floor(Math.random() * (BOARD_SIZE - CIRCLE_SIZE * 2)) +
          CIRCLE_SIZE,
        left:
          Math.floor(Math.random() * (BOARD_SIZE - CIRCLE_SIZE * 2)) +
          CIRCLE_SIZE,
      };
      overlap = existingPositions.some(
        (pos) =>
          Math.abs(pos.top - newPos.top) < CIRCLE_SIZE &&
          Math.abs(pos.left - newPos.left) < CIRCLE_SIZE
      );
    } while (overlap);
    return newPos;
  };

  // Genera los círculos de cada ronda usando el número definido en dificultad
  const generateCircles = () => {
    const newDirection = getRandomDirection();
    const newArrowDirection = getRandomDirection();
    const newColor = getRandomColor();

    setCurrentDirection(newDirection);
    setArrowDirection(newArrowDirection);

    const arrowColor =
      difficulty.arrowContrast < 1
        ? newColor === "yellow"
          ? "#B8860B" // Un amarillo oscuro tipo "DarkGoldenRod" para contrastar
          : newColor === "green"
            ? "#006400" // Un verde oscuro tipo "DarkGreen" para mayor diferencia
            : newColor // Mantener el mismo color para otros casos
        : newColor === "yellow"
          ? "black" // Alto contraste con amarillo
          : newColor === "green"
            ? "white" // Alto contraste con verde
            : "black"; // Negro por defecto para otros colores

    let positions = [];
    const numCircles = difficulty.numCircles;
    const newCircles = Array.from({ length: numCircles }).map(() => {
      const position = generateRandomPosition(positions);
      positions.push(position);
      return {
        color: newColor,
        moveDirection: newDirection,
        arrowDirection: newArrowDirection,
        position,
        arrowColor,
      };
    });

    setCircles(newCircles);
  };

  // Detecta colisiones (si la posición nueva está muy cercana a otra)
  const detectCollision = (newPosition, otherCircles) => {
    return otherCircles.some((circle) => {
      const dx = Math.abs(circle.position.left - newPosition.left);
      const dy = Math.abs(circle.position.top - newPosition.top);
      return dx < 10 && dy < 10;
    });
  };

  // Movimiento de los círculos con efecto wrap-around
  const moveCircles = () => {
    setCircles((prevCircles) =>
      prevCircles.map((circle, index, allCircles) => {
        const newPosition = { ...circle.position };
        const step = difficulty.speed; // Velocidad dinámica

        if (currentDirection === "up") {
          newPosition.top -= step;
          // Si el círculo se ha movido completamente fuera por arriba (más allá de -100px),
          // se reposiciona en la parte inferior en 600px.
          if (newPosition.top <= -CIRCLE_SIZE) {
            newPosition.top = BOARD_SIZE;
          }
        } else if (currentDirection === "down") {
          newPosition.top += step;
          // Si el círculo se ha movido completamente fuera por abajo (más allá de 600px),
          // se reposiciona en la parte superior en -100px.
          if (newPosition.top >= BOARD_SIZE) {
            newPosition.top = -CIRCLE_SIZE;
          }
        } else if (currentDirection === "left") {
          newPosition.left -= step;
          if (newPosition.left <= -CIRCLE_SIZE) {
            newPosition.left = BOARD_SIZE;
          }
        } else if (currentDirection === "right") {
          newPosition.left += step;
          if (newPosition.left >= BOARD_SIZE) {
            newPosition.left = -CIRCLE_SIZE;
          }
        }

        const otherCircles = allCircles.filter((_, i) => i !== index);
        if (detectCollision(newPosition, otherCircles)) {
          return circle; // Si hay colisión, se mantiene la posición actual
        }

        return { ...circle, position: newPosition };
      })
    );
  };

  // Se mueve cada 100ms mientras haya tiempo
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(moveCircles, 100);
    return () => clearInterval(interval);
  }, [currentDirection, difficulty, timeLeft]);

  // Manejo de la tecla presionada
  const handleKeyPress = (e) => {
    if (timeLeft <= 0) return; // No se procesan entradas si se acabó el tiempo
    setTotalCards((prev) => prev + 1); // Incrementa total de tarjetas presentadas

    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    const pressedDirection = keyMap[e.key];
    if (!pressedDirection) return;

    // Comprueba que todos los círculos cumplan la condición (depende del color)
    const correct = circles.every((circle) => {
      if (circle.color === "yellow") {
        return arrowDirection === pressedDirection;
      } else if (circle.color === "green") {
        return currentDirection === pressedDirection;
      }
      return false;
    });

    if (correct) {
      setCorrectAnswers((prev) => prev + 1); // Incrementa respuestas correctas
      // Respuesta correcta: se suma 50 y se incrementa el contador de aciertos consecutivos
      const newConsecutive = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutive);
      setScore((prev) => prev + 50);

      // Cada 4 aciertos consecutivos se suma bonus y se otorga una estrella
      if (newConsecutive % 4 === 0) {
        const bonus = 100 + ((newConsecutive / 4 - 1) * 50);
        setScore((prev) => prev + bonus);
        setStars((prev) => prev + 1);
      }
    } else {
      // Respuesta incorrecta: se resta 50 y se reinicia el contador de aciertos consecutivos
      setErrors((prev) => prev + 1); // Incrementa errores
      setScore((prev) => prev - 50);
      setConsecutiveCorrect(0);
    }

    if (lastKeyTime) {
      const reactionTime = performance.now() - lastKeyTime; // en ms
      setReactionTimes((prev) => [...prev, reactionTime]);
    }

    generateCircles();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [circles, currentDirection, arrowDirection, consecutiveCorrect, timeLeft]);

  // Respuestas rápidas (<250ms)
  const fastAnswers = reactionTimes.filter(rt => rt < FAST_THRESHOLD).length;

  // Tiempo de reacción promedio (en segundos)
  const avgReactionTime =
    reactionTimes.length > 0
      ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 1000).toFixed(2)
      : "0.00";

  return (
    <div
      className={
        `concentrarse-body relative w-full h-screen bg-gray-900 flex items-center justify-center` +
        (gameStarted && !gameOver ? " concentrarse-body-bordered" : "")
      }
    >
      <div className="concentrarse-game-container relative">
        {/* 1. FIN DEL JUEGO */}
        {gameOver ? (
          <div className="concentrarse-fin-juego-container">
            <h1>Fin del juego</h1>
            <div className="concentrarse-stats-table-wrapper">
              <table className="concentrarse-stats-table">
                <thead>
                  <tr>
                    <th>⏱️ Tiempo total</th>
                    <th>🎯 Puntaje final</th>
                    <th>⭐ Estrellas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{totalTime}s</td>
                    <td>{score}</td>
                    <td>{stars}</td>
                  </tr>
                  <tr>
                    <td>✅ Correctas: {correctAnswers} de {totalCards}</td>
                    <td>❌ Errores: {errors}</td>
                    <td>📊 Precisión: {totalCards > 0 ? `${((correctAnswers / totalCards) * 100).toFixed(2)}%` : "0%"}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>⚡ Respuestas rápidas: {fastAnswers}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>🕒 Tiempo de reacción promedio: {avgReactionTime}s</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button onClick={startCountdown}>Jugar de nuevo</button>
          </div>
        ) :
          /* 2. PANTALLA DE INICIO O CUENTA REGRESIVA */
          !gameStarted ? (
            countdown !== null ? ( // Primero verifica si hay countdown
              <div className="concentrarse-countdown">{countdown}</div>
            ) : (
              <div className="concentrarse-start-screen">
                <h2>¡Bienvenido a Color y acción!</h2>
                <button onClick={startCountdown}>Comenzar Juego</button>
              </div>
            )
          ) : (
            /* 3. JUEGO ACTIVO */
            <>
              {/* Barra de estadísticas arriba */}
              <section className="concentrarse-info-row">
                <div className="stat-item">
                  <strong>Puntaje:</strong> <span>{score}</span>
                </div>
                <div className="stat-item">
                  <strong>Errores:</strong> <span>{errors}</span>
                </div>
                <div className="stat-item">
                  <strong>Tiempo restante:</strong> <span>{timeLeft}s</span>
                </div>
              </section>
              {/* Contenedor de los círculos */}
              <div className="concentrarse-circle-container">
                {circles.map((circle, index) => (
                  <Circle key={index} {...circle} difficulty={difficulty} />
                ))}
              </div>
            </>
          )}
      </div>
    </div>
  );
};

// Componente Circle
const Circle = ({ color, arrowDirection, position, arrowColor, difficulty }) => {
  const directionArrows = {
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
  };

  // Usamos siempre el arrowColor calculado en generateCircles
  const computedArrowColor = arrowColor;

  return (
    <div
      className={`concentrarse-circle ${color}`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        position: "absolute",
        width: `${CIRCLE_SIZE}px`,
        height: `${CIRCLE_SIZE}px`,
      }}
    >
      <span style={{ color: computedArrowColor }}>
        {directionArrows[arrowDirection]}
      </span>
    </div>
  );
};

export default ConcentrarseEnElObjetivo;
