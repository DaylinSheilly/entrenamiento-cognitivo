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
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [isSolutionCorrect, setIsSolutionCorrect] = useState(false);
  const [isSolutionWrong, setIsSolutionWrong] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [recoveryTimes, setRecoveryTimes] = useState([]);
  const [levels, setLevels] = useState(levelsData);
  const [message, setMessage] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const timerRef = useRef(null);
  const errorTimeRef = useRef(null);

  // Iniciar el temporizador del juego
  useEffect(() => {
    console.log("Cargando niveles de juego...");
    setLevels(levelsData); // Asegura que el nivel inicial se carga
  }, []); // Se ejecuta solo una vez cuando el componente se monta

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

  const startGame = () => {
    console.log("Iniciando juego...");
    setLevels(levelsData); // Reiniciar los niveles
    setCurrentLevel(0); // Reiniciar el nivel actual
    setGameOver(false);
    setGameStarted(true);
    setScore(0);
    setErrors(0);
    setCorrectAnswers(0);
    setTotalAnswers(0);
    setMessage("");
    setTotalTime(0);
    setCountdown(null);
  
    errorTimeRef.current = Date.now();
    timerRef.current = Date.now();
  
    if (levels.length > 0) {
      console.log("Cargando nivel inicial...");
      loadLevel(levels[0]); // Solo cargar si hay niveles disponibles
    }
  };

  const loadLevel = (level) => {
    console.log("Cargando nivel:", level);

    console.log("Cargando nivel con tamaño de cuadrícula:", level.gridSize);
    setGridSize(level.gridSize);
    
    const newGrid = Array.from({ length: level.gridSize }, (_, x) =>
        Array.from({ length: level.gridSize }, (_, y) => {
            const element = level.elements.find((el) => el.x === x && el.y === y);
            return element || { type: "empty", rotation: 0, locked: true };
        })
    );
    console.log("Nueva cuadrícula:", newGrid);
    setGrid(newGrid);
    setMessage("");
    errorTimeRef.current = Date.now(); // Reiniciar tiempo de error
  };

  const rotatePiece = (x, y) => {
    setGrid((prevGrid) =>
        prevGrid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
                if (rowIndex === x && colIndex === y && !cell.locked) {
                    return { ...cell, rotation: (cell.rotation + 90) % 360 };
                }
                return cell;
            })
        )
    );
  };

  const verifySolution = () => {
    console.log(!levels[currentLevel]);
    if (!grid || !levels[currentLevel]) return false; // Evita errores si grid o niveles no están cargados

    const currentAnswer = levels[currentLevel].answer;
    for (const { x, y, type, rotation } of currentAnswer) {
        const cell = grid[x]?.[y]; // Usa `?.` para evitar errores si `grid[x]` es undefined
        if (!cell || cell.type !== type) return false;

        if (type === "pipe") {
            if (cell.rotation !== rotation && cell.rotation !== (rotation + 180) % 360) return false;
        } else if (type === "pipe-angle" || type === "pipe-T") {
            if (cell.rotation !== rotation) return false;
        }
    }
    return true;
  };

  const calculateRecoveryTime = () => {
    if (!errorTimeRef.current) return "0.00";
    return ((Date.now() - errorTimeRef.current) / 1000).toFixed(2);
  };

  const startFlow = () => {
    setTotalAnswers((prev) => prev + 1);
    if (verifySolution()) {
        setScore((prev) => prev + 100);
        calculateRecoveryTime(); // Solo calcular, no modificar el estado aquí

        setMessage("¡Excelente trabajo! Has completado el nivel con éxito.");

        if (!isSolutionCorrect) {
          setCorrectAnswers((prev) => prev + 1);
            setIsSolutionCorrect(true);
            setTimeout(() => {
                setIsSolutionCorrect(false);
                if (!gameOver) nextLevel();
            }, 1000);
        }
    } else {
        setErrors((prev) => prev + 1);
        setMessage("¡Ups! Algunas conexiones no son correctas. Por favor, inténtalo de nuevo.");

        if (!isSolutionWrong) {
            setIsSolutionWrong(true);
            setTimeout(() => setIsSolutionWrong(false), 500);
        }
    }
  };

  const nextLevel = () => {
    setCurrentLevel((prev) => {
        const newLevel = prev + 1;

        if (newLevel >= levels.length) {
            console.log("🏁 El juego ha terminado, no hay más niveles.");
            setGameOver(true);
            if (timerRef.current) {
                setTotalTime(Date.now() - timerRef.current);
            }
            return 0;
        }

        console.log("➡ Cargando nivel:", newLevel);
        loadLevel(levels[newLevel]);
        setMessage("¡Bienvenido al siguiente nivel! Sigue así.");

        return newLevel;
    });
  };

  return (
    <div className="pipe-game-container">
      {gameOver ? (
        <div className="pipe-fin-juego-container">
          <h1>Fin del juego</h1>
          <p>🎯 Puntaje final: {score}</p>
          <p>✅ Correctas: {correctAnswers} de {totalAnswers}</p>
          <p>📊 Precisión: {totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : "0"}%</p>
          <p>🕒 Tiempo total de juego: {(totalTime / 1000).toFixed(2)} segundos</p>
          <p>🕒 Tiempo de recuperación: {calculateRecoveryTime()}</p>
          <button onClick={startCountdown}>
            Jugar de nuevo
          </button>
        </div>
      ) : !gameStarted ? (
        countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
          <div className="pipe-start-screen">
            <h2>¡Bienvenido a Construye la tubería!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="pipe-countdown">{countdown}</div>
        )
      ) : (
        <div className="pipe-app">
          <>
            <div className="pipe-game-info">
              <div className="pipe-game-stats">
                <p>Puntaje: {score}</p>
                <p>Errores: {errors}</p>
              </div>
              {message && <p>{message}</p>}
            </div>
          </>
          <main className="pipe-main">
            <div
              className="pipe-grid"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {grid.map((row, x) =>
                row.map((cell, y) => (
                  <div
                    key={`${x}-${y}`}
                    className={`pipe-cell pipe-${cell.type} 
                    ${isSolutionCorrect ? "pipe-cell-correct-solution" : ""} 
                    ${isSolutionWrong ? "pipe-cell-wrong-solution" : ""}`}
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
          <button onClick={startFlow}>
            Iniciar flujo
          </button>
        </div>
      )}
    </div>
  );
};

export default App;