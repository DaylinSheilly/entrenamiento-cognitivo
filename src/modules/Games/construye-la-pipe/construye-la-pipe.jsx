import React, { useState, useEffect, useRef } from "react";
import "./construye-la-pipe.css";
import levelsData from "./maps.json";
import pipeImage from "./assets/pipe.png";
import pipeAngleImage from "./assets/pipe-angle.png";
import pipeTImage from "./assets/pipe-T.png";
import pipeCrossImage from "./assets/pipe-cross.png";

const App = ({ onGameEnd }) => {
  const [grid, setGrid] = useState([]);
  const [gridSize, setGridSize] = useState(5);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [levelTime, setLevelTime] = useState(0);
  const [levelTimes, setLevelTimes] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isSolutionCorrect, setIsSolutionCorrect] = useState(false);
  const [isSolutionWrong, setIsSolutionWrong] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [recoveryStartTime, setRecoveryStartTime] = useState(null);
  const [recoveryTimes, setRecoveryTimes] = useState([]);
  const [recoveryLevel, setRecoveryLevel] = useState(null);
  const [levels, setLevels] = useState(levelsData);
  const [message, setMessage] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const timerRef = useRef(null);
  const errorTimeRef = useRef(null);
  const levelTimerRef = useRef(null);
  const isHandlingGameEnd = useRef(false);

  // FUNCIONES DE REGISTRO DE ESTADISTICAS -------------------------------------------- //

  const gameData = {
    game_name: "Construye la cañería",
    level: currentLevel + 1, // Nivel actual (suma 1 porque currentLevel es 0-based)
    difficulty: currentLevel + 1 <= 2 ? "fácil" :
      currentLevel + 1 <= 4 ? "medio" : "difícil",
    actions_taken: totalAnswers, // Total de interacciones del jugador
    accuracy: totalAnswers > 0 ?
      Number(((correctAnswers / totalAnswers) * 100).toFixed(2)) : 0,
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

  // Iniciar el temporizador del juego
  useEffect(() => {
    console.log("Cargando niveles de juego...");
    setLevels(levelsData); // Asegura que el nivel inicial se carga
  }, []); // Se ejecuta solo una vez cuando el componente se monta

  useEffect(() => {
    return () => {
      if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    };
  }, []);

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

    // Resetear todos los estados
    setLevels(levelsData);
    setCurrentLevel(0);
    setGameOver(false);
    setGameStarted(true);
    setScore(0);
    setErrors(0);
    setLevelTime(0);
    setLevelTimes([]);
    setCorrectAnswers(0);
    setTotalAnswers(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setIsSolutionCorrect(false);
    setIsSolutionWrong(false);
    setMessage("");
    setTotalTime(0);
    setGrid([]);
    setGridSize(5);
    setRecoveryTimes([]);
    setRecoveryStartTime(null);
    setRecoveryLevel(null);

    // Limpiar intervalos
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);

    // Inicializar referencias
    errorTimeRef.current = Date.now();
    timerRef.current = Date.now();

    // Cargar nivel inicial
    if (levels.length > 0) {
      console.log("Cargando nivel inicial...");
      loadLevel(levels[0]);
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

    setLevelTime(0); // Reinicia el tiempo del nivel
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    levelTimerRef.current = setInterval(() => {
      setLevelTime(prev => prev + 1);
    }, 1000);

    console.log("Nueva cuadrícula:", newGrid);
    setGrid(newGrid);
    setMessage("");
    errorTimeRef.current = Date.now(); // Reiniciar tiempo de error
    setRecoveryStartTime(null);
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
    if (recoveryTimes.length === 0) return "N/A";
    const average = recoveryTimes.reduce((sum, obj) => sum + obj.time, 0) / recoveryTimes.length;
    return `${(average / 1000).toFixed(2)} s`;
  };

  const startFlow = () => {
    setTotalAnswers(prev => prev + 1);
    if (verifySolution()) {
      setScore((prev) => prev + 100);
      calculateRecoveryTime(); // Solo calcular, no modificar el estado aquí

      setMessage("¡Excelente trabajo! Has completado el nivel con éxito.");

      if (
        recoveryStartTime !== null &&
        recoveryLevel === currentLevel &&
        !recoveryTimes.some(rt => rt.level === currentLevel)
      ) {
        const recoveryTime = Date.now() - recoveryStartTime;
        setRecoveryTimes(prev => [...prev, { level: currentLevel, time: recoveryTime }]);
        setRecoveryStartTime(null);
        setRecoveryLevel(null);
      }

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
      if (recoveryStartTime === null) {
        setRecoveryStartTime(Date.now());
        setRecoveryLevel(currentLevel);
      }

      if (!isSolutionWrong) {
        setIsSolutionWrong(true);
        setTimeout(() => setIsSolutionWrong(false), 500);
      }
    }
  };

  const nextLevel = () => {
    setCurrentLevel((prev) => {
      const newLevel = prev + 1;
      setLevelTimes(times => [...times, levelTime]);

      if (errors === 0) {
        setCurrentStreak(prevStreak => {
          const newStreak = prevStreak + 1;
          if (newStreak > maxStreak) setMaxStreak(newStreak);
          return newStreak;
        });
      } else {
        setCurrentStreak(0); // Reiniciar racha si hubo errores
      }

      if (newLevel >= levels.length) {
        setGameOver(true);
        if (levelTimerRef.current) clearInterval(levelTimerRef.current);
        setTotalTime(levelTimes.reduce((acc, t) => acc + t, 0) + levelTime);
        return 0;
      }

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
          <div className="pipe-stats-table-wrapper">
            <table className="pipe-stats-table">
              <thead>
                <tr>
                  <th>⏱️ Tiempo total</th>
                  <th>🎯 Puntaje final</th>
                  <th>🏆 Niveles completados</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{totalTime} s</td>
                  <td>{score}</td>
                  <td>{currentLevel + 1}</td>
                </tr>
                <tr>
                  <td>✅ {correctAnswers} correctas</td>
                  <td>❌ {errors} errores</td>
                  <td>
                    📊 {totalAnswers > 0
                      ? `${((correctAnswers / totalAnswers) * 100).toFixed(2)}%`
                      : "0%"}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3}>
                    🕒 Tiempo de recuperación: {calculateRecoveryTime()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={startCountdown}>
            Jugar de nuevo
          </button>
        </div>
      ) : !gameStarted ? (
        countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
          <div className="pipe-start-screen">
            <h2>¡Bienvenido a Construye la cañería!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="pipe-countdown">{countdown}</div>
        )
      ) : (
        <div className="pipe-app">
          <section className="pipe-info-row">
            <div className="stat-item">
              <strong>Puntaje:</strong> <span>{score}</span>
            </div>
            <div className="stat-item">
              <strong>Errores:</strong> <span>{errors}</span>
            </div>
            <div className="stat-item">
              <strong>Tiempo:</strong> <span>{levelTime}s</span>
            </div>
          </section>
          {message && <p>{message}</p>}
          <div className="stat-item">
            <strong>Nivel:</strong> <span>{currentLevel + 1}</span>
          </div>
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