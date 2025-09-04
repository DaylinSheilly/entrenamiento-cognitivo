import React, { useState, useEffect, useRef } from "react";
import './recuerda-los-objetos.css';

const TIME_LIMIT = 120;
const allObjects = ["🚗", "⭐", "🍎", "⚽", "📖", "✏️", "🌸", "🐕", "☁️", "👟", "🍏", "⚾", "🖊️", "🌺", "🐩", "🧢"];

const MemoryGame = ({ onGameEnd }) => {
  const [sequence, setSequence] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showingSequence, setShowingSequence] = useState(true);
  const [playerSelection, setPlayerSelection] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [errors, setErrors] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [readyForOmission, setReadyForOmission] = useState(false);
  const [longestCorrectSequence, setLongestCorrectSequence] = useState(0);
  const [currentCorrectSequence, setCurrentCorrectSequence] = useState(0);
  const [message, setMessage] = useState("");
  const [averageResponseTime, setAverageResponseTime] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [omissionErrors, setOmissionErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [showErrorSequence, setShowErrorSequence] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [globalConsecutiveErrors, setGlobalConsecutiveErrors] = useState(0);
  const [recoveryStartTime, setRecoveryStartTime] = useState(null);
  const [recoveryTimes, setRecoveryTimes] = useState([]);
  const [pendingRecoveryLevel, setPendingRecoveryLevel] = useState(null);
  const [gridItems, setGridItems] = useState([]);
  const [clickedIndex, setClickedIndex] = useState(null);
  const isHandlingGameEnd = useRef(false);

  // FUNCIONES DE REGISTRO DE ESTADISTICAS -------------------------------------------- //

  const totalAttempts = correctAnswers + errors + omissionErrors;
  const gameData = {
    game_name: "Recuerda los objetos",
    level: currentLevel,
    difficulty: currentLevel <= 3 ? "fácil" :
      currentLevel <= 6 ? "medio" : "difícil",
    actions_taken: totalAttempts,
    accuracy: totalAttempts > 0
      ? Number(((correctAnswers / totalAttempts) * 100).toFixed(2))
      : 0,
    streaks: longestCorrectSequence,
    errors: errors + omissionErrors, // Suma ambos tipos de errores
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

  useEffect(() => {
    if (!gameStarted || gameOver || showingSequence || showErrorSequence) return;

    // Mezcla inicial al montar la cuadrícula
    const mixGrid = () => {
      const distractors = allObjects
        .filter((item) => !sequence.includes(item))
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(currentLevel + 2, allObjects.length - sequence.length));
      setGridItems([...sequence, ...distractors].sort(() => 0.5 - Math.random()));
    };

    mixGrid(); // Mezcla inicial

    const interval = setInterval(() => {
      mixGrid();
    }, 3000);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, showingSequence, showErrorSequence, sequence, currentLevel]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    if (!showingSequence && !showErrorSequence && sequence.length > 0) {
      setReadyForOmission(true);
    } else {
      setReadyForOmission(false);
    }
  }, [showingSequence, showErrorSequence, sequence, gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      setGameStarted(false);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, gameOver, timeLeft]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    if (currentLevel > 8) {
      setGameOver(true);
      setGameStarted(false);
      return;
    }
    // Genera nueva secuencia
    const newSequence = allObjects
      .sort(() => 0.5 - Math.random())
      .slice(0, currentLevel + 2);
    setSequence(newSequence);
    setShowingSequence(true);
    setMessage("¡Memoriza la secuencia!");
    const sequenceTimer = setTimeout(() => {
      setShowingSequence(false);
      setMessage("Ahora es tu turno, selecciona la secuencia");
      setStartTime(Date.now());
    }, 3000 + currentLevel * 500);

    return () => clearTimeout(sequenceTimer);
  }, [currentLevel, gameStarted, gameOver]);

  // Timer para respuestas omitidas (solo cuando se muestran distractores)
  useEffect(() => {
    if (!showingSequence && sequence.length > 0) {
      const missedTimer = setTimeout(() => {
        setPlayerSelection([]);
      }, 5000 + currentLevel * 500);

      return () => clearTimeout(missedTimer);
    }
  }, [showingSequence, playerSelection, sequence, currentLevel]);

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
    setCurrentLevel(1);
    setShowingSequence(true);
    setPlayerSelection([]);
    setTimeLeft(TIME_LIMIT);
    setScore(0);
    setStars(0);
    setCorrectAnswers(0);
    setErrors(0);
    setGameStarted(true);
    setGameOver(false);
    setCountdown(null);
    setLongestCorrectSequence(0);
    setCurrentCorrectSequence(0);
    setMessage("");
    setAverageResponseTime(0);
    setResponseTimes([]);
    setOmissionErrors(0);
    setStartTime(null);
    setShowErrorSequence(false);
    setConsecutiveErrors(0);
    setGlobalConsecutiveErrors(0);
    setRecoveryStartTime(null);
    setRecoveryTimes([]);
    setPendingRecoveryLevel(null);
    if (isHandlingGameEnd.current) isHandlingGameEnd.current = false;
  };

  // Manejar selección del jugador
  const handleSelection = (item, index) => {
    setClickedIndex(index);
    setTimeout(() => setClickedIndex(null), 300); // Dura 300ms la animación
    // Lógica existente:
    handleAnswer();
    setPlayerSelection(prev => [...prev, item]);
  };

  const handleCorrectAnswer = () => {
    setCurrentCorrectSequence(prev => {
      const newSequence = prev + 1;
      // Suma una estrella cada vez que se alcanza un múltiplo de 4 aciertos consecutivos
      if (newSequence % 4 === 0) {
        setStars(prevStars => prevStars + 1);
      }
      return newSequence;
    });
    setLongestCorrectSequence(prev => Math.max(prev, currentCorrectSequence + 1));
  };

  const handleIncorrectAnswer = () => {
    setCurrentCorrectSequence(0);
  };

  // Registra el tiempo de respuesta y actualiza la lista y el promedio
  const handleAnswer = () => {
    const responseTime = Date.now() - startTime;
    setResponseTimes(prev => {
      const newTimes = [...prev, responseTime];
      const avgTime = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
      setAverageResponseTime(avgTime);
      return newTimes;
    });
  };

  const mostrarRecordatorioSecuencia = () => {
    setMessage("¡Intenta de nuevo!");
    setTimeout(() => {
      setShowErrorSequence(true);
      setMessage("¡Memoriza la secuencia nuevamente!");
      setTimeout(() => {
        setShowErrorSequence(false);
        setMessage("Ahora es tu turno, selecciona la secuencia");
      }, 1500);
    }, 1000);
  };

  // Verifica la respuesta completa del usuario
  useEffect(() => {
    if (playerSelection.length > 0 && playerSelection.length === sequence.length) {
      const isCorrect = sequence.every((item, index) => item === playerSelection[index]);

      if (isCorrect) {
        handleCorrectAnswer();
        setScore(prev => prev + 10);
        setCorrectAnswers(prev => prev + 1);
        setCurrentLevel(prev => prev + 1);
        setConsecutiveErrors(0);
        setGlobalConsecutiveErrors(0);
        if (
          recoveryStartTime !== null &&
          pendingRecoveryLevel === currentLevel
        ) {
          const recoveryTime = (Date.now() - recoveryStartTime) / 1000; // EN SEGUNDOS
          setRecoveryTimes(prev => [...prev, recoveryTime]);
          setRecoveryStartTime(null);
          setPendingRecoveryLevel(null);
        }
      } else {
        handleIncorrectAnswer();
        setErrors(prev => prev + 1);
        setConsecutiveErrors(prev => prev + 1);
        setGlobalConsecutiveErrors(prev => prev + 1);
        if (recoveryStartTime === null) {
          setRecoveryStartTime(Date.now());
          setPendingRecoveryLevel(currentLevel);
        }

        if (globalConsecutiveErrors + 1 >= 4) {
          setGameOver(true);
          setGameStarted(false);
          setMessage("¡Juego terminado por demasiados errores consecutivos!");
          setTimeout(() => setMessage(""), 2000);
          return;
        }

        if (consecutiveErrors + 1 >= 2) {
          if (currentLevel == 1) {
            mostrarRecordatorioSecuencia()
          } else {
            setCurrentLevel(prev => Math.max(1, prev - 1));
            setConsecutiveErrors(0); // Reinicia el contador de errores de nivel
            setShowErrorSequence(false);
            setTimeout(() => {
              setMessage("Nivel reducido por errores consecutivos.");
              setTimeout(() => setMessage(""), 2000);
            }, 200);
          }
        } else {
          mostrarRecordatorioSecuencia();
        }
      }

      setPlayerSelection([]);
    }
  }, [playerSelection, sequence]);

  // Calcular omisiones por tiempo agotado
  useEffect(() => {
    // 1. Verifica condiciones para omitir la ejecución
    if (!gameStarted || gameOver) return;
    if (showingSequence || showErrorSequence) return;
    if (sequence.length === 0) return;
    if (playerSelection.length > 0) return; // Solo una verificación necesaria

    // 2. Configura el temporizador de omisión
    const omissionTimer = setTimeout(() => {
      if (playerSelection.length === 0) {
        // 3. Lógica de error de omisión
        setOmissionErrors(prev => prev + sequence.length);
        setErrors(prev => prev + 1);
        setConsecutiveErrors(prev => prev + 1);
        setGlobalConsecutiveErrors(prev => prev + 1);
        if (recoveryStartTime === null) {
          setRecoveryStartTime(Date.now());
          setPendingRecoveryLevel(currentLevel);
        }

        // 4. Verificar fin del juego por 4 errores
        if (globalConsecutiveErrors + 1 >= 4) {
          setGameOver(true);
          setGameStarted(false);
          setMessage("¡Juego terminado por demasiados errores consecutivos!");
          setTimeout(() => setMessage(""), 4000);
          setPlayerSelection([]);
          return;
        }

        // 5. Bajar nivel si corresponde
        if (consecutiveErrors + 1 >= 2 && currentLevel !== 1) {
          setCurrentLevel(prev => Math.max(1, prev - 1));
          setConsecutiveErrors(0);
          setShowErrorSequence(false);
          setTimeout(() => {
            setMessage("Nivel reducido por errores consecutivos.");
            setTimeout(() => setMessage("Ahora es tu turno, selecciona la secuencia"), 2000);
          }, 200);
        } else {
          // 6. Mostrar secuencia de recordatorio
          setMessage("⏳ Te demoraste demasiado. ¡Memoriza la secuencia nuevamente!");
          setShowErrorSequence(true);
          setTimeout(() => {
            setShowErrorSequence(false);
            setMessage("Ahora es tu turno, selecciona la secuencia");
          }, 1500);
        }

        setPlayerSelection([]);
      }
    }, 5000);

    // 7. Limpiar temporizador al desmontar o actualizar
    return () => clearTimeout(omissionTimer);
  }, [
    gameStarted,
    gameOver,
    showingSequence,
    showErrorSequence,
    sequence,
    playerSelection, // Solo una vez en las dependencias
    consecutiveErrors,
    globalConsecutiveErrors,
    currentLevel,
    readyForOmission // Asegurar que está actualizado correctamente
  ]);

  const calculateRecoveryAvg = () => {
    if (recoveryTimes.length === 0) return "N/A";
    const avg = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;
    return (avg / 1000).toFixed(2); // En segundos
  };

  // Cuando se muestran los distractores, calcular la cuadrícula de forma dinámica:
  // 1. Se filtran los objetos que no están en la secuencia.
  // 2. Se mezclan y se limita la cantidad según el nivel.
  // 3. Se combinan con la secuencia y se mezclan nuevamente.
  // 4. Se calcula el número de columnas como la raíz cuadrada redondeada hacia arriba.
  const distractors = allObjects
    .filter((item) => !sequence.includes(item))
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(currentLevel + 2, allObjects.length - sequence.length));
  const gridColumns = Math.ceil(Math.sqrt(gridItems.length));

  return (
    <div className="recuerda-objetos-body">
      {gameOver ? (
        <div className="recuerda-objetos-juego-contenedor">
          <div className="recuerda-objetos-fin-juego">
            <h1>Fin del juego</h1>
            <div className="recuerda-stats-table-wrapper">
              <table className="recuerda-stats-table">
                <thead>
                  <tr>
                    <th>⏱️ Tiempo total</th>
                    <th>🎯 Puntaje final</th>
                    <th>🏆 Nivel máximo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{TIME_LIMIT - timeLeft} s</td>
                    <td>{score}</td>
                    <td>{currentLevel}</td>
                  </tr>
                  <tr>
                    <td>✅ {correctAnswers} correctas</td>
                    <td>❌ {errors} errores</td>
                    <td>
                      📊 Precisión: {(correctAnswers + errors) > 0
                        ? ((correctAnswers / (correctAnswers + errors)) * 100).toFixed(2)
                        : "0"}%
                    </td>
                  </tr>
                  <tr>
                    <td>⭐ {stars} Estrellas</td>
                    <td>🏅 Racha máxima: {longestCorrectSequence}</td>
                    <td>🕒 Tiempo de reacción promedio: {responseTimes.length > 0
                      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
                      : "N/A"} s</td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      🕒 Tiempo de recuperación promedio: {recoveryTimes.length > 0
                        ? (recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length).toFixed(2)
                        : "N/A"} s
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button
              className="recuerda-objetos-seleccion-boton"
              onClick={startCountdown}
            >
              Jugar de nuevo
            </button>
          </div>
        </div>
      ) : !gameStarted ? (
        countdown === null ? (
          <div className="recuerda-objetos-start-screen">
            <h2>¡Bienvenido a Recuerda los Objetos!</h2>
            <button
              className="recuerda-objetos-seleccion-boton"
              onClick={startCountdown}
            >
              Comenzar Juego
            </button>
          </div>
        ) : (
          <div className="recuerda-objetos-countdown">{countdown}</div>
        )
      ) : (
        <div className="recuerda-objetos-juego-contenedor">
          <h1>Recuerda los Objetos</h1>

          <section className="recuerda-info-row">
            <div className="stat-item">
              <strong>Puntaje:</strong> <span>{score}</span>
            </div>
            <div className="stat-item">
              <strong>Errores:</strong> <span>{errors}</span>
            </div>
            <div className="stat-item">
              <strong>Tiempo:</strong>
              <span>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                {String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>
          </section>
          <div className="stat-item">
            <strong>Nivel:</strong> <span>{currentLevel}</span>
          </div>

          {showingSequence || showErrorSequence ? (
            <div className="recuerda-objetos-objetos-contenedor fila-horizontal">
              {sequence.map((item, index) => (
                <span
                  key={index}
                  style={{
                    margin: "0px",
                    fontSize: "1.6em",
                    color: showErrorSequence ? "#ff4444" : "inherit"
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div
              className="recuerda-objetos-objetos-contenedor"
              style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
            >
              {gridItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSelection(item, index)}
                  className={`recuerda-objetos-objeto ${clickedIndex === index ? 'clicked' : ''}`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          {message && (
            <div className={`recuerda-objetos-mensaje${message.includes("¡Intenta de nuevo!") ? "" : " info"}`}>
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoryGame;
