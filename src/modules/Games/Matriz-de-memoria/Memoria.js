import React, { useState, useEffect } from "react";
import "./Memoria.css";

const SQUARE_SIZE = 40;
const displayTime = 1000; // Tiempo en milisegundos (1 segundo)
const maxLevel = 9;

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

  // Genera una nueva secuencia de cuadrados
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

  // Iniciar el juego
  const startGame = () => {
    setGameStarted(true);
    resetGame();
  };

  // Inicializa el juego con la secuencia cuando el nivel cambia
  useEffect(() => {
    if (!gameStarted) return;

    if (level > maxLevel) {
      setGameFinished(true);
      setMessage("¡Felicidades! Has completado todos los niveles.");
      return;
    }

    const setupLevel = () => {
      if (!error) {
        const newSequence = generateSequence(gridSize);
        setSequence(newSequence);
      }

      setSelected([]);
      setIsClickable(false);
      setShowSequence(true);
      setMessage(`Memoriza la secuencia`);

      setTimeout(() => {
        setShowSequence(false);
        setMessage(`Selecciona los cuadrados del patrón`);
        setIsClickable(true);
      }, displayTime);
    };

    setupLevel();
  }, [level, gridSize, error, gameStarted]);

  const handleSquareClick = (row, col) => {
    if (!isClickable || gameFinished) return;

    const clickedSquare = `${row}-${col}`;
    if (selected.includes(clickedSquare)) {
      // Permitir deseleccionar un cuadrado
      setSelected(selected.filter(square => square !== clickedSquare));
    } else {
      setSelected([...selected, clickedSquare]);
    }
  };

  const arraysEqual = (arr1, arr2) => {
    return arr1.length === arr2.length && arr1.every((value) => arr2.includes(value));
  };

  const handleUserSelection = () => {
    if (!isClickable) return;

    if (arraysEqual(selected, sequence)) {
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
      setError(true);
      setMessage("¡Secuencia incorrecta! Intenta de nuevo");
      setTimeout(() => {
        setSelected([]);
        setShowSequence(true);
        setIsClickable(false);
        setTimeout(() => {
          setShowSequence(false);
          setMessage("Selecciona los cuadrados correctos");
          setIsClickable(true);
        }, displayTime);
      }, 1000);
    }
  };

  const resetGame = () => {
    setLevel(1);
    setGridSize(2);
    setSelected([]);
    setError(false);
    setGameFinished(false);
    setShowSequence(true);
    setMessage("Memoriza la secuencia");
    setSequence(generateSequence(2));
    setIsClickable(false);

    setTimeout(() => {
      setShowSequence(false);
      setMessage("Selecciona los cuadrados correctos");
      setIsClickable(true);
    }, displayTime);
  };

  return (
    <div class="memory-body">
      <div className="memory-game">
        <memory-h1>Matriz de Memoria</memory-h1>
        {!gameStarted ? (
          <div className="memory-start-screen">
            <memory-h2>¡Bienvenido al Matriz de Memoria!</memory-h2>
            <p className="memory-message">Memoriza los patrones y reproduce la secuencia para avanzar de nivel.</p>
            <memory-button className="memory-start-button" onClick={startGame}>
              Comenzar Juego
            </memory-button>
          </div>
        ) : (
          <>
            <div className="memory-game-info">
              <h3>Nivel {level}</h3>
              <p className={error ? "memory-message error" : "memory-message"}>{message}</p>
            </div>

            {!gameFinished && (
              <div
                className="memory-grid"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, ${SQUARE_SIZE}px)`,
                  gridTemplateRows: `repeat(${gridSize}, ${SQUARE_SIZE}px)`,
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
                        className={`memory-square ${showSequence && isActive ? "active" : ""
                          } ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSquareClick(row, col)}
                      />
                    );
                  })
                )}
              </div>
            )}

            {!gameFinished && selected.length > 0 && (
              <memory-button
                className="verify-button"
                onClick={handleUserSelection}
                disabled={!isClickable}
              >
                Verificar Secuencia
              </memory-button>
            )}

            {gameFinished && (
              <div className="memory-game-over">
                <h2>¡Felicidades!</h2>
                <p className="memory-message">Has completado todos los niveles</p>
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