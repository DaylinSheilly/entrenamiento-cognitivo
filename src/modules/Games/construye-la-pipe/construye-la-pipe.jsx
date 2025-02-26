import React, { useState, useEffect, useRef } from "react";
import "./construye-la-pipe.css";
import levelsData from "./maps.json";
import pipeImage from "./assets/pipe.png";
import pipeAngleImage from "./assets/pipe-angle.png";
import pipeTImage from "./assets/pipe-T.png";
import pipeCrossImage from "./assets/pipe-cross.png";

const App = () => {
  const [grid, setGrid] = useState([]);
  const [gridSize, setGridSize] = useState(5);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levels, setLevels] = useState([]);
  const [message, setMessage] = useState("");
  const [gameFinished, setGameFinished] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [recoveryTimes, setRecoveryTimes] = useState([]);
  const timerRef = useRef(null);
  const errorTimeRef = useRef(null);

  // Iniciar el temporizador del juego
  useEffect(() => {
    timerRef.current = Date.now();
    setLevels(levelsData);
    loadLevel(levelsData[currentLevel]);
  }, []);

  const loadLevel = (level) => {
    if (!level) {
      console.error("Nivel no encontrado");
      return;
    }
    setGridSize(level.gridSize);
    const newGrid = Array.from({ length: level.gridSize }, (_, x) =>
      Array.from({ length: level.gridSize }, (_, y) => {
        const element = level.elements.find((el) => el.x === x && el.y === y);
        return (
          element || {
            type: "empty",
            rotation: 0,
            locked: true,
          }
        );
      })
    );
    setGrid(newGrid);
    setMessage("");
    // Reiniciar el tiempo de error cuando se carga un nuevo nivel
    errorTimeRef.current = Date.now();
  };

  const rotatePiece = (x, y) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (rowIndex === x && colIndex === y && !cell.locked) {
            const updatedCell = { ...cell, rotation: (cell.rotation + 90) % 360 };
            return updatedCell;
          }
          return cell;
        })
      );
      return newGrid;
    });
  };

  const verifySolution = () => {
    const currentAnswer = levels[currentLevel].answer;
    for (const answerCell of currentAnswer) {
      const { x, y, type, rotation } = answerCell;
      const cell = grid[x][y];
      if (!cell || cell.type !== type) {
        return false;
      }
      if (type === "pipe") {
        if (cell.rotation !== rotation && cell.rotation !== (rotation + 180) % 360) {
          return false;
        }
      } else if (type === "pipe-angle" || type === "pipe-T") {
        if (cell.rotation !== rotation) {
          return false;
        }
      }
    }
    return true;
  };

  const startFlow = () => {
    if (verifySolution()) {
      setScore((prev) => prev + 100);
      setMessage("¡Excelente trabajo! Has completado el nivel con éxito.");
      // Calcular tiempo de recuperación si hubo error
      if (errorTimeRef.current) {
        const recovery = Date.now() - errorTimeRef.current;
        setRecoveryTimes((prev) => [...prev, recovery]);
      }
      nextLevel();
    } else {
      setErrors((prev) => prev + 1);
      setMessage("¡Ups! Algunas conexiones no son correctas. Por favor, inténtalo de nuevo.");
    }
  };

  const nextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel((prev) => prev + 1);
      loadLevel(levels[currentLevel + 1]);
      setMessage("¡Bienvenido al siguiente nivel! Sigue así.");
    } else {
      // Juego completado
      setGameFinished(true);
      const totalGameTime = Date.now() - timerRef.current;
      setTotalTime(totalGameTime);
    }
  };

  return (
    <div className="pipe-app">
      {!gameFinished ? (
        <>
          <header className="pipe-header">
            <h1 className="pipe-title">Construye la Cañería</h1>
          </header>
          <main className="pipe-main">
            <div
              className="pipe-grid"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {grid.map((row, x) =>
                row.map((cell, y) => (
                  <div
                    key={`${x}-${y}`}
                    className={`pipe-cell pipe-${cell.type}`}
                    style={{ transform: `rotate(${cell.rotation}deg)` }}
                    onClick={() => rotatePiece(x, y)}
                  >
                    {cell.type === "source" && "💧"}
                    {cell.type === "plant" && "🌱"}
                    {cell.type === "pipe" && (
                      <img src={pipeImage} alt="Tubería recta" />
                    )}
                    {cell.type === "pipe-angle" && (
                      <img src={pipeAngleImage} alt="Tubería curva" />
                    )}
                    {cell.type === "pipe-T" && (
                      <img src={pipeTImage} alt="Tubería en T" />
                    )}
                    {cell.type === "pipe-cross" && (
                      <img src={pipeCrossImage} alt="Tubería cruzada" />
                    )}
                  </div>
                ))
              )}
            </div>
          </main>
          <header className="pipe-header">
            <div className="pipe-controls">
              <button className="pipe-button" onClick={startFlow}>
                Iniciar flujo
              </button>
            </div>
            <div className="pipe-status">
              <p className="pipe-score">Puntaje: {score}</p>
              <p className="pipe-errors">Errores: {errors}</p>
            </div>
            {message && <p className="pipe-message">{message}</p>}
          </header>
        </>
      ) : (
        <div className="game-end">
          <h2 className="end-title">Fin del Juego</h2>
          <p className="end-stats">
            <strong>Tiempo total de juego:</strong>{" "}
            {(totalTime / 1000).toFixed(2)} segundos
          </p>
          <p className="end-stats">
            <strong>Total de errores:</strong> {errors}
          </p>
          <p className="end-stats">
            <strong>Tiempo de recuperación promedio:</strong>{" "}
            {recoveryTimes.length > 0
              ? (recoveryTimes.reduce((a, b) => a + b, 0) /
                  recoveryTimes.length /
                  1000
                ).toFixed(2)
              : "0"}{" "}
            segundos
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
