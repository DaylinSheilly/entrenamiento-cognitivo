import React, { useState, useEffect, useRef } from "react";
import "./Memoria.css";

const displayTime = 1000; // Tiempo en milisegundos (1 segundo)
const maxLevel = 9;
const minSquareSize = 25; // Tamaño mínimo
const maxSquareSize = 50; // Tamaño máximo

const MemoryGame = () => {
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(2);
  const [sequence, setSequence] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("Memoriza la secuencia");
  const [showSequence, setShowSequence] = useState(true);
  const [isClickable, setIsClickable] = useState(false);
  const [error, setError] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Estados para las estadísticas
  const [score, setScore] = useState(50); // Inicia en 50
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [bonusValue, setBonusValue] = useState(100); // Bono inicial para 4 aciertos consecutivos
  const [stars, setStars] = useState(0);

  const timers = useRef([]);

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
  const initializeLevel = (currentGridSize) => {
    const newSequence = generateSequence(currentGridSize);
    setSequence(newSequence);
    setSelected([]);
    setIsClickable(false);
    setShowSequence(true);
    setMessage("Memoriza la secuencia");

    if (level < 6) {
      // Niveles 1-5: Sin rotación.
      setRotationAngle(0);
      addTimeout(() => {
        setShowSequence(false);
        setMessage("Selecciona los cuadrados correctos");
        setIsClickable(true);
      }, displayTime);
    } else if (level >= 6 && level <= 7) {
      // Niveles 6-7: Se muestra el patrón ya rotado sumándole +90 o -90 al ángulo actual.
      setRotationAngle((prev) => prev + (Math.random() < 0.5 ? 90 : -90));
      addTimeout(() => {
        setShowSequence(false);
        setMessage("Selecciona los cuadrados correctos");
        setIsClickable(true);
      }, displayTime);
    } else if (level >= 8 && level <= 9) {
      // Niveles 8-9: Se muestra el patrón sin rotación (se conserva el ángulo actual).
      addTimeout(() => {
        setShowSequence(false);
        setMessage("Selecciona los cuadrados correctos");
        setIsClickable(true);
        // 200ms después, se suma o resta 90° al ángulo actual.
        addTimeout(() => {
          setRotationAngle((prev) => prev + (Math.random() < 0.5 ? 90 : -90));
        }, 200);
      }, displayTime);
    }
  };

  const resetAfterError = () => {
    addTimeout(() => {
      setSelected([]);
      setShowSequence(true);
      setIsClickable(false);
      if (level < 6) {
        setRotationAngle(0);
        addTimeout(() => {
          setShowSequence(false);
          setMessage("Selecciona los cuadrados correctos");
          setIsClickable(true);
        }, displayTime);
      } else if (level >= 6 && level <= 7) {
        setRotationAngle((prev) => prev + (Math.random() < 0.5 ? 90 : -90));
        addTimeout(() => {
          setShowSequence(false);
          setMessage("Selecciona los cuadrados correctos");
          setIsClickable(true);
        }, displayTime);
      } else if (level >= 8 && level <= 9) {
        // En niveles 8-9 se muestra el patrón sin cambiar la rotación.
        addTimeout(() => {
          setShowSequence(false);
          setMessage("Selecciona los cuadrados correctos");
          setIsClickable(true);
          // Luego, 200ms después, se aplica la rotación acumulada.
          addTimeout(() => {
            setRotationAngle((prev) => prev + (Math.random() < 0.5 ? 90 : -90));
          }, 200);
        }, displayTime);
      }
      setError(false);
    }, 1000);
  };

  const startGame = () => {
    setGameStarted(true);
    resetGame();
  };

  const resetGame = () => {
    setLevel(1);
    setGridSize(2);
    setError(false);
    setGameFinished(false);
    // Reiniciar estadísticas
    setScore(50);
    setConsecutiveCorrect(0);
    setBonusValue(100);
    setStars(0);
    timers.current.forEach((timerId) => clearTimeout(timerId));
    timers.current = [];
    initializeLevel(2);
  };

  useEffect(() => {
    if (!gameStarted) return;

    if (level > maxLevel) {
      setGameFinished(true);
      setMessage("¡Felicidades! Has completado todos los niveles.");
      return;
    }

    initializeLevel(gridSize);
  }, [level, gridSize, gameStarted]);

  const handleSquareClick = (row, col) => {
    if (!isClickable || gameFinished) return;

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

    if (arraysEqual(selected, sequence)) {
      // Acierto: suma 50 puntos base
      setScore((prevScore) => prevScore + 50);
      const newConsecutive = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutive);
      // Cada 4 aciertos consecutivos se otorga un bono
      if (newConsecutive % 4 === 0) {
        setScore((prevScore) => prevScore + bonusValue);
        setStars((prevStars) => prevStars + 1);
        setBonusValue((prevBonus) => prevBonus + 50);
      }
      const nextLevel = level + 1;
      if (nextLevel > maxLevel) {
        setGameFinished(true);
        setMessage("¡Felicidades! Has completado todos los niveles.");
      } else {
        setMessage(`¡Correcto! Avanzando al nivel ${nextLevel}`);
        setLevel(nextLevel);
        setGridSize(gridSize + 1);
        setError(false);
      }
    } else {
      // Error: se reinician contadores y el bono vuelve a 100
      setError(true);
      setMessage("¡Secuencia incorrecta! Intenta de nuevo");
      setConsecutiveCorrect(0);
      setBonusValue(100);
      resetAfterError();
    }
  };

  const squareSize = calculateSquareSize(level);

  return (
    <div className="memory-body">
      <div className="memory-game">
        {!gameStarted ? (
          <div className="memory-start-screen">
            <h2 className="memory-h2">¡Bienvenido al Matriz de Memoria!</h2>
            <button className="memory-start-button" onClick={startGame}>
              Comenzar Juego
            </button>
          </div>
        ) : (
          <>
            <h1 className="memory-h1">Matriz de Memoria</h1>
            <div className="memory-game-info">
              <h3 className="memory-h3">Nivel {level}</h3>
              <p className={error ? "memory-message error" : "memory-message"}>{message}</p>
              <p className="memory-score">Puntaje: {score}</p> {/* Muestra el puntaje actual */}
            </div>

            {!gameFinished && (
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
                        className={`memory-square ${showSequence && isActive ? "active" : ""} ${isSelected ? "selected" : ""}`}
                        style={{ width: squareSize - 7, height: squareSize - 7 }}
                        onClick={() => handleSquareClick(row, col)}
                      />
                    );
                  })
                )}
              </div>
            )}

            {!gameFinished && selected.length === sequence.length && (
              <memory-button className="verify-button" onClick={handleUserSelection} disabled={!isClickable}>
                Verificar Secuencia
              </memory-button>
            )}

            {gameFinished && (
              <div className="memory-game-over">
                <h2 className="memory-h2">¡Felicidades!</h2>
                <p className="memory-message">Has completado todos los niveles</p>
                <div className="game-stats">
                  <p>Puntaje Final: {score}</p>
                  <p>Estrellas Obtenidas: {stars}</p>
                  <p>Nivel Alcanzado: {level}</p>
                </div>
                <memory-button onClick={() => {
                  setGameStarted(false);
                  resetGame();
                }}>
                  Jugar de Nuevo
                </memory-button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;
