import React, { useState, useEffect, useRef } from "react";
import "./Memoria.css";

const displayTime = 1000; // Tiempo en milisegundos (1 segundo)
const maxLevel = 9;
const minSquareSize = 25; // Tamaño mínimo
const maxSquareSize = 50; // Tamaño máximo

const MemoryGame = ({ onGameEnd }) => {
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(2);
  const [sequence, setSequence] = useState([]);
  const [selected, setSelected] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [message, setMessage] = useState("Memoriza la secuencia");
  const [showSequence, setShowSequence] = useState(true);
  const [isClickable, setIsClickable] = useState(false);
  const [error, setError] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [globalSquareColor, setGlobalSquareColor] = useState(null);

  // Estados para las estadísticas
  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(50); // Inicia en 50
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [errors, setErrors] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [bonusValue, setBonusValue] = useState(100); // Bono inicial para 4 aciertos consecutivos
  const [stars, setStars] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const timers = useRef([]);
  const consecutiveErrorsRef = useRef(0);
  const timerRef = useRef(null);
  const isHandlingGameEnd = useRef(false);

  // FUNCIONES DE REGISTRO DE ESTADISTICAS -------------------------------------------- //

  const gameData = {
    game_name: "Matriz de memoria",
    level: level,
    difficulty: level <= 5 ? "fácil" :
      level <= 7 ? "medio" : "difícil",
    actions_taken: correctAnswers + errors, // Total de intentos
    accuracy: (correctAnswers + errors) > 0 ?
      Number(((correctAnswers / (correctAnswers + errors)) * 100).toFixed(2)) : 0,
    streaks: maxStreak,
    errors: errors,
    score: score,
  };

  const handleGameEnd = () => {
    // Envía los datos al GameLayout
    // console.log("Datos del juego:", gameData);
    onGameEnd(gameData);
  };

  useEffect(() => {
    if (gameOver && !isHandlingGameEnd.current) {
      isHandlingGameEnd.current = true;
      handleGameEnd();
      isHandlingGameEnd.current = false;
    }
  }, [gameOver]);

  // Función para calcular el tamaño de los cuadrados basado en el nivel
  const calculateSquareSize = (level) => {
    return maxSquareSize - ((level - 1) / (maxLevel - 1)) * (maxSquareSize - minSquareSize);
  };

  const addTimeout = (callback, delay) => {
    const timerId = setTimeout(callback, delay);
    timers.current.push(timerId);
  };

  useEffect(() => {
    return () => {
      timers.current.forEach(timerId => clearTimeout(timerId));
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    if (consecutiveCorrect > maxStreak) {
      setMaxStreak(consecutiveCorrect);
    }
  }, [consecutiveCorrect]);

  const generateSequence = (size) => {
    const newSequence = [];
    while (newSequence.length < size) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      const newSquare = `${row}-${col}`;
      if (!newSequence.includes(newSquare)) {
        newSequence.push(newSquare);
      }
    }
    return newSequence;
  };

  // Inicializa el nivel y aplica la rotación según las reglas:
  // • Niveles 1-5: Sin rotación.
  // • Nivel 6: Se muestra el patrón ya rotado (90° o -90°) mientras se visualiza.
  // • Niveles 7-9: Se muestra el patrón sin rotación y, luego de ocultarlo,
  //             se espera 200ms y se aplica la rotación (90° o -90°).
  const initializeLevel = (currentGridSize, nextLevel = level) => {
    const newSequence = generateSequence(currentGridSize);
    setSequence(newSequence);
    setSelected([]);
    setIsClickable(false);
    setShowSequence(true);
    setMessage("Memoriza la secuencia");
    setGlobalSquareColor(null);

    // Calcula el ángulo de rotación según el nivel
    let rotation = rotationAngle;
    if (nextLevel >= 6 && nextLevel <= 7) {
      rotation += Math.random() < 0 ? 90 : -90;
    }
    setRotationAngle(rotation);

    // Muestra la secuencia y luego permite interacción
    addTimeout(() => {
      setShowSequence(false);
      setMessage("Selecciona los cuadrados correctos");
      setIsClickable(true);
      // Para niveles 8-9, rota después de mostrar la secuencia
      if (nextLevel >= 8 && nextLevel <= 9) {
        addTimeout(() => {
          setRotationAngle(prev => prev + (Math.random() < 0 ? 90 : -90));
        }, 200);
      }
    }, displayTime);
  };

  const startCountdown = () => {
    setGameStarted(false);
    setCountdown(3); // Inicia en 3 segundos
    let timeLeft = 3;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft === 0) {
        clearInterval(interval);
        setCountdown(null);
        setGameStarted(true); // Inicia el juego cuando llega a 0
        startGame();
      }
    }, 1000);
  };

  const resetAfterError = () => {
    // Espera la animación de error (800ms) y luego inicia el nivel de nuevo
    initializeLevel(gridSize, level);
    setError(false);
    setGlobalSquareColor(null);
  };


  const startGame = () => {
    setGameStarted(true);
    resetGame();

    // Iniciar temporizador
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  };

  const resetGame = () => {
    setLevel(1);
    setGridSize(2);
    setError(false);
    setGameOver(false);
    setGlobalSquareColor(null);
    // Reiniciar estadísticas
    setScore(50);
    setErrors(0);
    setConsecutiveCorrect(0);
    setBonusValue(100);
    setStars(0);
    consecutiveErrorsRef.current = 0;
    timers.current.forEach((timerId) => clearTimeout(timerId));
    timers.current = [];
    initializeLevel(2);
    clearInterval(timerRef.current);
    setElapsedTime(0);
  };

  useEffect(() => {
    if (!gameStarted) return;

    if (level > maxLevel) {
      setGameOver(true);
      setMessage("¡Felicidades! Has completado todos los niveles.");
      return;
    }

    initializeLevel(gridSize);
  }, [level, gridSize, gameStarted]);

  const handleSquareClick = (row, col) => {
    if (!isClickable || gameOver) return;

    const clickedSquare = `${row}-${col}`;
    if (selected.includes(clickedSquare)) {
      setSelected(selected.filter((square) => square !== clickedSquare));
    } else {
      setSelected([...selected, clickedSquare]);
    }
  };

  // Compara dos arreglos sin considerar el orden
  const arraysEqual = (arr1, arr2) => {
    return arr1.length === arr2.length && arr1.every((value) => arr2.includes(value));
  };

  // Al verificar la selección del usuario se actualizan las estadísticas
  const handleUserSelection = () => {
    if (!isClickable) return;
    setIsClickable(false);

    if (arraysEqual(selected, sequence)) {
      setCorrectAnswers(prev => prev + 1);
      // Resetear errores consecutivos al acertar
      consecutiveErrorsRef.current = 0;
      setGlobalSquareColor("green");
      addTimeout(() => {
        setGlobalSquareColor(null);
        setScore(prev => prev + 50);
        const newConsecutive = consecutiveCorrect + 1;
        setConsecutiveCorrect(newConsecutive);
        if (newConsecutive % 4 === 0) {
          setScore(prev => prev + bonusValue);
          setStars(prev => prev + 1);
          setBonusValue(prev => prev + 50);
        }
        const nextLevel = level + 1;
        if (nextLevel > maxLevel) {
          clearInterval(timerRef.current);
          setGameOver(true);
          setMessage("¡Felicidades! Has completado todos los niveles.");
        } else {
          setLevel(nextLevel);
          setGridSize(gridSize + 1);
          setError(false);
          initializeLevel(gridSize + 1, nextLevel);
        }
      }, 800);
    } else {
      consecutiveErrorsRef.current += 1;
      setGlobalSquareColor("red");
      setErrors(prev => prev + 1);

      addTimeout(() => {
        // Game Over tras 4 errores consecutivos
        if (consecutiveErrorsRef.current >= 4) {
          clearInterval(timerRef.current);
          setGameOver(true);
          setMessage("¡Demasiados errores consecutivos! Juego terminado");
          consecutiveErrorsRef.current = 0;
        }
        // Reducción de nivel tras 2 errores
        else if (consecutiveErrorsRef.current == 2) {
          const newLevel = Math.max(1, level - 1);
          const newGridSize = Math.max(2, gridSize - 1);
          setLevel(newLevel);
          setGridSize(newGridSize);
          setMessage(`Nivel reducido a ${newLevel}`);
          initializeLevel(newGridSize, newLevel);
        } else {
          setMessage("¡Secuencia incorrecta! Intenta de nuevo");
          resetAfterError();
        }
      }, 800);
    }
  };

  const squareSize = calculateSquareSize(level);

  return (
    <div className="memory-body">
      <div className="memory-game">
        {!gameStarted ? (
          countdown === null ? (
            <div className="memory-start-screen">
              <h2 className="memory-h2">¡Bienvenido al Matriz de Memoria!</h2>
              <button className="memory-start-button" onClick={startCountdown}>
                Comenzar Juego
              </button>
            </div>
          ) : (
            <div className="memory-countdown">{countdown}</div>
          )
        ) : (
          <>
            <section className="memory-info-row">
              <div className="stat-item">
                <strong>Puntaje:</strong> <span>{score}</span>
              </div>
              <div className="stat-item">
                <strong>Errores:</strong> <span>{errors}</span>
              </div>
              <div className="stat-item">
                <strong>Tiempo:</strong> <span>{elapsedTime}</span>
              </div>
            </section>
            {!gameOver && (
              <p className={`memory-message${error ? " error" : ""}`}>{message}</p>
            )}
            <div className="stat-item">
              <strong>Nivel:</strong> <span>{level}</span>
            </div>

            {!gameOver && (
              <div
                className="memory-grid"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, ${squareSize}px)`,
                  gridTemplateRows: `repeat(${gridSize}, ${squareSize}px)`,
                  transform: level >= 6 ? `rotate(${rotationAngle}deg)` : "rotate(0deg)",
                  transition: "transform 0.5s ease-in-out",
                }}
              >
                {Array.from({ length: gridSize }).map((_, row) =>
                  Array.from({ length: gridSize }).map((_, col) => {
                    const squareId = `${row}-${col}`;
                    const isActive = sequence.includes(squareId);
                    const isSelected = selected.includes(squareId);

                    return (
                      <div
                        key={squareId}
                        className={`memory-square 
    ${showSequence && isActive ? "active" : ""} 
    ${isSelected ? "selected" : ""}`}
                        style={{
                          width: squareSize - 7,
                          height: squareSize - 7,
                          backgroundColor: globalSquareColor
                            ? globalSquareColor
                            : (showSequence && isActive)
                              ? "#3498db"
                              : isSelected
                                ? "#2ecc71"
                                : "white",
                          borderColor: globalSquareColor
                            ? (globalSquareColor === "green" ? "#27ae60" : "#e74c3c")
                            : (isSelected
                              ? "#27ae60"
                              : "#bdc3c7")
                        }}
                        onClick={() => handleSquareClick(row, col)}
                      />
                    );
                  })
                )}
              </div>
            )}

            {!gameOver && selected.length === sequence.length && (
              <memory-button className="verify-button" onClick={handleUserSelection} disabled={!isClickable}>
                Verificar Secuencia
              </memory-button>
            )}

            {gameOver && (
              <div className="memory-game-over">
                <h2 className="memory-h2">¡Juego Terminado!</h2>
                <p className="memory-message">{message}</p>
                <div className="memory-stats-table-wrapper">
                  <table className="memory-stats-table">
                    <thead>
                      <tr>
                        <th>⏱️ Tiempo total</th>
                        <th>🎯 Puntaje final</th>
                        <th>🏆 Niveles completados</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{elapsedTime} s</td>
                        <td>{score}</td>
                        <td>{level}</td>
                      </tr>
                      <tr>
                        <td>✅ {correctAnswers} correctas</td>
                        <td>❌ {errors} errores</td>
                        <td>
                          📊 {correctAnswers + errors > 0
                            ? `${((correctAnswers / (correctAnswers + errors)) * 100).toFixed(2)}%`
                            : "0%"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button onClick={startCountdown}>
                  Jugar de Nuevo
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;
