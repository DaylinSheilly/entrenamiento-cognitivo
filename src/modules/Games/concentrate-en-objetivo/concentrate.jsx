import React, { useState, useEffect, useRef } from 'react';
import './concentrate.css';

const GAME_TIME = 45; // Tiempo total del juego en segundos
const GRID_SIZE = 520; // Tamaño fijo del grid

const ConcentranteEnElObjetivo = ({ onGameEnd }) => {
  const [showIntro, setShowIntro] = useState(true); // Nueva vista inicial
  const [gameStarted, setGameStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(50);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [stars, setStars] = useState(0);
  const [targetDirection, setTargetDirection] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [timer, setTimer] = useState(GAME_TIME);
  const [circles, setCircles] = useState([]);
  const circleSize = 55; // Tamaño del círculo
  const directions = ['↑', '↓', '←', '→'];
  const [targetColor, setTargetColor] = useState('');
  const targetDirectionRef = useRef();
  const [maxStreak, setMaxStreak] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const startTimeRef = useRef(null);
  const isGenerating = useRef(false);
  const timeoutRef = useRef();
  const isHandlingGameEnd = useRef(false);

  // FUNCIONES DE REGISTRO DE ESTADISTICAS -------------------------------------------- //

  const gameData = {
    game_name: "Concéntrate en el objetivo",
    level: stage,  // Nivel actual alcanzado
    difficulty: stage <= 2 ? "fácil" : stage <= 4 ? "medio" : "difícil",
    actions_taken: totalCards,  // Total de interacciones del jugador
    accuracy: totalCards > 0 ? Number(((correctAnswers / totalCards) * 100).toFixed(2)) : 0,
    streaks: maxStreak,  // Máxima racha de aciertos consecutivos
    errors: totalErrors,
    score: score
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

  useEffect(() => {
    if (consecutiveCorrect > maxStreak) {
      setMaxStreak(consecutiveCorrect);
    }
  }, [consecutiveCorrect]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || gameOver) return;

      const directionMap = {
        ArrowUp: '↑',
        ArrowDown: '↓',
        ArrowLeft: '←',
        ArrowRight: '→'
      };

      const direction = directionMap[e.key];
      if (direction) handleInput(direction);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted, gameOver]); // Solo recrear cuando cambien estos estados

  const startGame = () => {
    // Reiniciar todos los estados principales
    setGameStarted(true);
    setGameOver(false);
    setStage(1);
    setRound(0);
    setScore(50);
    setCorrectAnswers(0);
    setTotalErrors(0);
    setTotalCards(0);
    setMaxStreak(0);
    setStars(0);
    setTargetDirection('');
    setCountdown(null);
    setTimer(GAME_TIME);
    setCircles([]);
    setTargetColor('');

    // Reiniciar estados secundarios y referencias
    setConsecutiveCorrect(0);
    setReactionTimes([]);
    targetDirectionRef.current = null;
    startTimeRef.current = null;

    // Generar primeros círculos
    generateCircles();
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (circles.length > 0) {
      startTimeRef.current = Date.now();
    }
  }, [circles]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(countdown);
  });

  useEffect(() => {
    if (countdown !== null) return; // Si hay cuenta regresiva, no restar tiempo

    if (timer > 0 && !gameOver && gameStarted) {
      const time = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(time);
    } else if (gameStarted && timer === 0) {
      setGameStarted(false);
      setGameOver(true);
    }
  }, [timer]);

  useEffect(() => {
    if (!gameStarted || isGenerating.current) return;

    isGenerating.current = true;
    generateCircles();
    const timer = setTimeout(() => {
      isGenerating.current = false;
    }, 100);

    return () => clearTimeout(timer);
  }, [round]);

  const generateCircles = () => {
    let newCircles = [];
    const numColumns = Math.max(1, Math.floor(GRID_SIZE / (circleSize + 20)));
    const numRows = Math.max(1, Math.floor(GRID_SIZE / (circleSize + 20)));
    const positions = [];
    let targetDir;

    switch (stage) {
      case 1:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;

        // console.log(`Debes presionar la flecha: ${targetDir}`);

        newCircles = Array.from({ length: numColumns }).map(() => ({
          direction: targetDir,
          color: 'black', // Color de fondo
          arrowColor: 'white' // Color de flecha por defecto
        }));
        break;

      case 2:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;
        // console.log(`Debes presionar la flecha común: ${targetDir}`);

        const numTarget = Math.ceil(numColumns * 0.6);
        const mixedDirections = [...Array(numTarget).fill(targetDir),
        ...Array(numColumns - numTarget).fill(null)]
          .map(dir => dir ?? directions[Math.floor(Math.random() * directions.length)]);
        newCircles = mixedDirections.map(direction => ({
          direction,
          color: 'black', // Color de fondo
          arrowColor: 'white' // Color de flecha por defecto
        }));
        break;

      case 3:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;

        let isValid = false;
        let attempts = 0;
        let directionsSet = [];

        do {
          // 1. Genera todas las direcciones excluyendo el objetivo
          directionsSet = Array.from({ length: numColumns }).map(() => {
            let randomDir;
            do {
              randomDir = directions[Math.floor(Math.random() * directions.length)];
            } while (randomDir === targetDir);
            return randomDir;
          });

          // 2. Elige 2 posiciones aleatorias para poner la dirección objetivo
          const indices = [];
          while (indices.length < 2) {
            const idx = Math.floor(Math.random() * numColumns);
            if (!indices.includes(idx)) indices.push(idx);
          }
          indices.forEach(idx => directionsSet[idx] = targetDir);

          // 3. Valida: solo la dirección objetivo debe aparecer exactamente 2 veces
          const counts = {};
          for (const dir of directionsSet) {
            counts[dir] = (counts[dir] || 0) + 1;
          }
          isValid =
            counts[targetDir] === 2 &&
            Object.entries(counts).filter(([dir, count]) => dir !== targetDir && count === 2).length === 0;

          attempts++;
        } while (!isValid && attempts < 100);

        // 4. Crea los círculos
        newCircles = directionsSet.map(direction => ({
          direction,
          color: 'black',
          arrowColor: 'white'
        }));
        // Mezclar para mayor aleatoriedad (opcional)
        newCircles = newCircles.sort(() => Math.random() - 0.5);
        break;

      case 4:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;

        // Parámetros para agrupar los círculos hacia la dirección objetivo
        const biasFactor = 0.7; // 70% de los círculos estarán "sesgados" hacia la dirección objetivo
        newCircles = Array.from({ length: numColumns }).map((_, idx) => {
          let x = 0, y = 0;

          // Decide si este círculo estará sesgado o no
          const isBiased = Math.random() < biasFactor;

          // Genera la posición según la dirección objetivo
          if (isBiased) {
            switch (targetDir) {
              case '↑': // Agrupa hacia arriba
                x = Math.random();
                y = Math.random() * 0.4;
                break;
              case '↓': // Agrupa hacia abajo
                x = Math.random();
                y = 0.6 + Math.random() * 0.4;
                break;
              case '←': // Agrupa hacia la izquierda
                x = Math.random() * 0.4;
                y = Math.random();
                break;
              case '→': // Agrupa hacia la derecha
                x = 0.6 + Math.random() * 0.4;
                y = Math.random();
                break;
              default:
                x = Math.random();
                y = Math.random();
            }
          } else {
            // Posición completamente aleatoria
            x = Math.random();
            y = Math.random();
          }

          // Convierte a píxeles
          return {
            direction: '',
            color: 'black',
            arrowColor: 'white',
            x: Math.floor(x * (GRID_SIZE - circleSize)),
            y: Math.floor(y * (GRID_SIZE - circleSize)),
          };
        });
        break;

      case 5:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;

        const numCircles = Math.min(numColumns * numRows, 30);

        // 1. Generar círculos con color base negro y flecha blanca
        newCircles = Array.from({ length: numCircles }).map(() => ({
          direction: directions[Math.floor(Math.random() * directions.length)],
          color: 'black', // Color de fondo
          arrowColor: 'white' // Color de flecha por defecto
        }));

        // 2. Seleccionar y modificar el círculo objetivo
        const targetIndex = Math.floor(Math.random() * numCircles);
        newCircles[targetIndex] = {
          ...newCircles[targetIndex],
          direction: targetDir,
          arrowColor: '#00f3ff', // Flecha cyan
        };

        break;
    }

    setCircles(newCircles.map((circle) => {
      let col, row, xPos, yPos;
      const offsetTopRows = 1; // Número de filas reservadas para el encabezado
      const minSpacing = circleSize * 1.2; // Espacio mínimo entre círculos
      const margen = numColumns > 1 ? (GRID_SIZE - (numColumns * circleSize)) / (numColumns - 1) : 0;
      const maxWidth = GRID_SIZE - circleSize;
      const maxHeight = GRID_SIZE - circleSize;

      let isOverlapping;

      do {
        isOverlapping = false; // Reiniciar estado de superposición

        if (stage === 4) {
          const biasFactor = Math.random() < 0.7 ? targetDir : directions[Math.floor(Math.random() * directions.length)];

          switch (biasFactor) {
            case '↑': // Favorecer la parte superior (pero no en la zona del encabezado)
              row = Math.floor(Math.random() * Math.ceil((numRows - offsetTopRows) * 0.4)) + offsetTopRows;
              col = Math.floor(Math.random() * numColumns);
              break;
            case '↓': // Favorecer la parte inferior
              row = Math.floor((numRows - offsetTopRows) * 0.6) + Math.floor(Math.random() * Math.ceil((numRows - offsetTopRows) * 0.4)) + offsetTopRows;
              col = Math.floor(Math.random() * numColumns);
              break;
            case '←': // Favorecer la izquierda
              col = Math.floor(Math.random() * Math.ceil(numColumns * 0.4));
              row = Math.floor(Math.random() * (numRows - offsetTopRows)) + offsetTopRows;
              break;
            case '→': // Favorecer la derecha
              col = Math.floor(numColumns * 0.6) + Math.floor(Math.random() * Math.ceil(numColumns * 0.4));
              row = Math.floor(Math.random() * (numRows - offsetTopRows)) + offsetTopRows;
              break;
            default: // Distribución normal
              col = Math.floor(Math.random() * numColumns);
              row = Math.floor(Math.random() * (numRows - offsetTopRows)) + offsetTopRows;
              break;
          }
        } else {
          col = Math.floor(Math.random() * numColumns);
          row = Math.floor(Math.random() * (numRows - offsetTopRows)) + offsetTopRows; // Evita la parte superior
        }

        // Calcular la posición en píxeles
        xPos = col * (circleSize + margen);
        yPos = row * (circleSize + margen);

        // 📌 Asegurar que los círculos no se salgan del área de juego
        xPos = Math.min(xPos, maxWidth);
        yPos = Math.min(yPos, maxHeight);

        // Verificar si esta posición está demasiado cerca de otro círculo
        isOverlapping = positions.some(pos => {
          const dx = pos.x - xPos;
          const dy = pos.y - yPos;
          return Math.sqrt(dx * dx + dy * dy) < minSpacing; // Verifica si la distancia es menor al mínimo permitido
        });

      } while (isOverlapping); // Si se solapan, repetir hasta encontrar una posición válida

      positions.push({ col, row, x: xPos, y: yPos }); // Guardar posición con coordenadas
      return { ...circle, x: xPos, y: yPos }; // Color inicial negro
    }));
  };

  const handleInput = (direction) => {
    const endTime = Date.now();
    const isCorrect = direction === targetDirectionRef.current;
    setTotalCards(prev => prev + 1);

    if (startTimeRef.current) {
      const reactionTime = endTime - startTimeRef.current;
      setReactionTimes(prev => [...prev, reactionTime]);
    }

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setCircles(prev => prev.map(c => ({ ...c, color: "green" })));

      setConsecutiveCorrect(prev => {
        const newConsecutive = prev + 1;

        if ((newConsecutive % 4) === 0) {
          const bonus = Math.floor(newConsecutive / 4) * 50;

          clearTimeout(timeoutRef.current);
          setStage(prevStage => {
            const newStage = Math.min(prevStage + 1, 5);
            setScore(s => s + 50 + bonus);
            setStars(s => s + 1);
            return newStage;
          });
          timeoutRef.current = setTimeout(() => {
            setRound(1);
          }, 300);
          return newConsecutive;
        }
        setScore(prev => prev + 50);
        return newConsecutive;
      });
    } else {
      setTotalErrors(prev => prev + 1);
      setScore(prev => Math.max(0, prev - 50));
      setConsecutiveCorrect(0);
      setCircles(prev => prev.map(c => ({ ...c, color: "red" })));
    }
    if (consecutiveCorrect + 1 % 4 !== 0) {
      timeoutRef.current = setTimeout(() => {
        setRound(prev => prev + 1);
      }, 300);
    }
  };

  const calculateReactionTime = () => {
    if (!reactionTimes || reactionTimes.length === 0) return 0;

    const validTimes = reactionTimes
      .filter(time => typeof time === "number" && !isNaN(time)); // Filtrar tiempos válidos
    if (validTimes.length === 0) return 0;
    return validTimes.reduce((acc, time) => acc + time, 0) / validTimes.length;
  };

  return (
    <div className="concentrate-body relative w-full h-screen bg-gray-900 flex items-center justify-center">
      <div className="concentrate-game-container relative">
        {gameOver ? (
          <div className="concentrate-fin-juego-container">
            <h1>Fin del juego</h1>
            <div className="concentrate-stats-table-wrapper">
              <table className="concentrate-stats-table">
                <thead>
                  <tr>
                    <th>⏱️ Tiempo total</th>
                    <th>🎯 Puntaje final</th>
                    <th>🏆 Nivel máximo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{GAME_TIME} s</td>
                    <td>{score}</td>
                    <td>{stage}</td>
                  </tr>
                  <tr>
                    <td>✅ {correctAnswers} correctas</td>
                    <td>❌ {totalErrors} errores</td>
                    <td>📊 Precisión: {totalCards > 0 ? ((correctAnswers / totalCards) * 100).toFixed(2) : "0"}%</td>
                  </tr>
                  <tr>
                    <td>⭐ {stars} Estrellas obtenidas</td>
                    <td>⚡ {reactionTimes.filter(t => t < 750).length} {/* Menos de 750ms */}
                      Respuestas rápidas
                      {reactionTimes.length > 0 &&
                        ` (${((reactionTimes.filter(t => t < 750).length / reactionTimes.length) * 100).toFixed(1)}%)`}</td>
                    <td>🏅 Máxima racha: {maxStreak}</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      🕒 Tiempo de reacción promedio: {calculateReactionTime() > 0 ?
                        `${(calculateReactionTime() / 1000).toFixed(2)} s` : "N/A"}
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
          countdown === null ? (
            <div className="concentrate-start-screen">
              <h2>¡Bienvenido a Concentrante en el Objetivo!</h2>
              <button onClick={startCountdown}>Comenzar Juego</button>
            </div>
          ) : (
            <div className="concentrate-countdown">{countdown}</div>
          )
        ) : (
          <div className="concentrate-app">
            {/* Barra de estadísticas superior */}
            <section className="concentrate-info-row">
              <div className="stat-item">
                <strong>Puntaje:</strong> <span>{score}</span>
              </div>
              <div className="stat-item">
                <strong>Errores:</strong> <span>{totalErrors}</span>
              </div>
              <div className="stat-item">
                <strong>Tiempo:</strong> <span>{timer}s</span>
              </div>
            </section>

            <div className="stat-item">
              <strong>Nivel:</strong> <span>{stage}</span>
            </div>

            {/* Área de juego */}
            <div className="concentrate-grid">
              {circles.map((circle, index) => (
                <div
                  key={index}
                  className="concentrate-circle"
                  style={{
                    backgroundColor: circle.color,
                    left: `${circle.x}px`,
                    top: `${circle.y}px`,
                    width: `${circleSize}px`,
                    height: `${circleSize}px`
                  }}
                >
                  <span style={{ color: circle.arrowColor }}>{circle.direction}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConcentranteEnElObjetivo;