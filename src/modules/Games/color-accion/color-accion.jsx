import React, { useState, useEffect } from "react";
import "./color-accion.css";

const directions = ["up", "down", "left", "right"];
const CIRCLE_SIZE = 100; // Tamaño de la caja de colisión de cada círculo
const BOARD_SIZE = 600;  // Tamaño del contenedor (600px x 600px)

// Funciones utilitarias para obtener valores aleatorios
const getRandomDirection = () =>
  directions[Math.floor(Math.random() * directions.length)];
const getRandomColor = () => (Math.random() > 0.5 ? "yellow" : "green");

const ConcentrarseEnElObjetivo = () => {
  // Estados del juego
  const [circles, setCircles] = useState([]);
  const [score, setScore] = useState(50);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [stars, setStars] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45); // en segundos
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
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  // Al iniciar, se generan los círculos
  useEffect(() => {
    generateCircles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer: cuenta regresiva de 45 segundos
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameStarted(false);
      setGameOver(true);
    }
  }, [timeLeft, gameStarted]);

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
    setGameStarted(true);
    setGameOver(false);


    generateCircles();
  };

  const startCountdown = () => {
    setCountdown(3); // Inicia en 3 segundos
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setCountdown(null); 
          startGame(); // Iniciar el juego cuando llega a 0
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

    console.log(difficulty.arrowContrast)

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
      setScore((prev) => prev - 50);
      setConsecutiveCorrect(0);
    }

    generateCircles();
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [circles, currentDirection, arrowDirection, consecutiveCorrect, timeLeft]);

  return (
    <div className="concentrarse-body relative w-full h-screen bg-gray-900 flex items-center justify-center">
      <div className="concentrarse-game-container relative">
        {!gameStarted ? (
          countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
            <div className="concentrarse-start-screen">
              <h2>¡Bienvenido a Concentrate en el objetivo!</h2>
              <button onClick={startCountdown}>
                Comenzar Juego
              </button>
            </div>
          ) : (
            // Mostrar la cuenta regresiva en pantalla
            <div className="concentrarse-countdown">{countdown}</div>
          )
        ) : !gameOver ? (
          <>
            {/* Puntaje en la parte superior izquierda */}
            <h2 className="absolute top-4 left-4 text-white text-2xl font-bold">
              🎯 Puntaje: {score}
            </h2>

            {/* Estrellas en la parte superior central */}
            <h3 className="absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-2xl font-bold">
              ⭐ Estrellas: {stars}
            </h3>

            {/* Contador en la parte superior derecha */}
            <h3 className="absolute top-4 right-4 text-white text-2xl font-bold">
              ⏳ Tiempo restante: {timeLeft}s
            </h3>

            {/* Contenedor de los círculos */}
            <div className="concentrarse-circle-container">
              {circles.map((circle, index) => (
                <Circle key={index} {...circle} difficulty={difficulty} />
              ))}
            </div>
          </>
        ) : (
          <div className="concentrarse-fin-juego-container">
            <h1>Fin del juego</h1>
            <p>🎯 Puntaje final: {score}</p>
            <p>✅ Correctas: {correctAnswers} de {totalCards}</p>
            <p>📊 Precisión: {totalCards > 0 ? ((correctAnswers / totalCards) * 100).toFixed(2) : "0"}%</p>
            <button onClick={startCountdown}>
              Jugar de nuevo
            </button>
          </div>
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
