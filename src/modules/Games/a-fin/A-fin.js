import React, { useState, useEffect, useRef } from 'react';
import words from './afinWords';
import './AFin.css';

// Constantes globales (deben declararse antes de usarlas en useState)
const ERROR_THRESHOLD = {
  1: 30, // Nivel 1: máximo 30% de errores
  2: 30, // Nivel 2: máximo 30% de errores
  3: 25, // Nivel 3: máximo 25% de errores
  4: 20, // Nivel 4: máximo 20% de errores
  5: 10, // Nivel 5: máximo 10% de errores
};

const LEVEL_TIME = {
  1: 60,
  2: 60,
  3: 45,
  4: 45,
  5: 30,
};

const MIN_SCORE_REQUIRED = {
  1: 15,
  2: 15,
  3: 15,
  4: 15,
  5: 15,
};

const SynonymGame = ({ onGameEnd }) => {
  // Estados de nivel y partida
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);      // Puntaje en el nivel actual
  const [errors, setErrors] = useState(0);      // Errores en el nivel actual
  const [time, setTime] = useState(LEVEL_TIME[1]);
  const [totalTime, setTotalTime] = useState(0); // Tiempo total de juego
  const [currentWord, setCurrentWord] = useState('');
  const [options, setOptions] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [levelPassed, setLevelPassed] = useState(false);
  const [nextLevelTimer, setNextLevelTimer] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [streak, setStreak] = useState(0);        // Racha actual de aciertos
  const [maxStreak, setMaxStreak] = useState(0);  // Máxima racha histórica
  const [levelFails, setLevelFails] = useState(0);
  const [currentWordObj, setCurrentWordObj] = useState(null);
  // Estados para estadísticas globales (se acumulan entre niveles)
  const [globalStats, setGlobalStats] = useState({
    totalScore: 0,
    totalErrors: 0,
    totalCorrect: 0,
    fastAnswers: 0,         // Respuestas hechas en menos de 1 segundo
    recoveryTimes: [],      // Array de tiempos de recuperación tras un error
  });

  // Ref para guardar la hora de inicio de la partida y de cada palabra
  const startTimeRef = useRef(Date.now());
  const lastWordTimestampRef = useRef(Date.now());
  const [lastErrorTimestamp, setLastErrorTimestamp] = useState(null);
  const prevWordRef = useRef(null); // Ref para guardar la palabra anterior
  const isHandlingGameEnd = useRef(false); // Ref para evitar múltiples envíos de datos al finalizar el juego

  const gameData = {
    game_name: "A fin",
    level: level,
    difficulty: level <= 2 ? "fácil" : level <= 4 ? "medio" : "difícil",
    actions_taken: globalStats.totalCorrect + globalStats.totalErrors,
    accuracy: Math.round(
      (globalStats.totalCorrect /
        (globalStats.totalCorrect + globalStats.totalErrors)) * 100
    ),
    streaks: maxStreak,
    errors: globalStats.totalErrors,
    score: globalStats.totalScore,
  };

  const handleGameEnd = () => {
    // Envía los datos al GameLayout
    // console.log("Datos del juego:", gameData);
    onGameEnd(gameData);
  };

  useEffect(() => {
    if (isGameOver && !isHandlingGameEnd.current) {
      isHandlingGameEnd.current = true;
      handleGameEnd();
      isHandlingGameEnd.current = false;
    }
  }, [isGameOver]);

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
    // Reiniciar estado de la partida
    setGameStarted(true);
    setLevel(1);
    setScore(0);
    setErrors(0);
    setGlobalStats({
      totalScore: 0,
      totalErrors: 0,
      totalCorrect: 0,
      fastAnswers: 0,
      recoveryTimes: [],
    });
    setStreak(0);
    setMaxStreak(0);
    setTime(LEVEL_TIME[1]);
    setCurrentWord('');
    setOptions([]);
    setGameOver(false);
    setIsGameOver(false);
    setLevelPassed(false);
    setCountdown(null); // Asegurar que el contador también se reinicie
    setLevelFails(0); // Reiniciar el contador de fallos por nivel

    // Limpiar temporizador de cambio de nivel si existía
    if (nextLevelTimer) {
      clearTimeout(nextLevelTimer);
    }
    setNextLevelTimer(null);

    // Reiniciar referencias de tiempo
    const now = Date.now();
    startTimeRef.current = now;
    lastWordTimestampRef.current = now;
    setLastErrorTimestamp(null);
  };


  // Temporizador del nivel
  useEffect(() => {
    if (countdown !== null) return; // Si hay cuenta regresiva, no restar tiempo

    if (time > 0 && !gameOver && gameStarted) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
      setTotalTime(prev => prev + 1);
      return () => clearTimeout(timer);
    } else if (time === 0 && !gameOver) {
      evaluateLevel();
    }
  }, [time, gameOver, countdown]);  // Se añade countdown como dependencia

  // Cada vez que se active el nivel y no haya finalizado, mostrar una nueva palabra
  useEffect(() => {
    if (!gameOver) {
      newWord();
    }
  }, [level, gameOver, gameStarted]);

  // Temporizador para avanzar al siguiente nivel (en caso de victoria)
  useEffect(() => {
    if (nextLevelTimer === null) return;
    if (nextLevelTimer > 0) {
      const timerId = setTimeout(() => setNextLevelTimer(nextLevelTimer - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (nextLevelTimer === 0 && levelPassed && level < 5) {
      advanceLevel();
    }
  }, [nextLevelTimer, levelPassed, level]);

  // Muestra una nueva palabra y registra el momento de aparición
  const newWord = () => {
    const levelWords = words[level];
    if (!levelWords) return;

    let candidate, swap, asTarget, attempts = 0;

    do {
      const randomIndex = Math.floor(Math.random() * levelWords.length);
      candidate = levelWords[randomIndex];
      swap = Math.random() < 0.5;
      asTarget = swap ? candidate.correct : candidate.target;

      attempts++;
      if (attempts > 10) break;

    } while (prevWordRef.current && asTarget === prevWordRef.current);

    const finalWordObj = swap ? {
      target: candidate.correct,
      correct: candidate.target,
      incorrect: candidate.incorrect
    } : candidate;

    setCurrentWord(finalWordObj.target);
    setCurrentWordObj(finalWordObj); // ← Guardar el objeto completo
    setOptions([finalWordObj.correct, ...finalWordObj.incorrect].sort(() => Math.random() - 0.5));
    prevWordRef.current = finalWordObj.target;
    lastWordTimestampRef.current = Date.now();
  };

  // Maneja la respuesta del usuario y registra estadísticas de reacción y recuperación de errores
  const handleChoice = (choice) => {
    if (!currentWordObj) return; // ← Usar el objeto guardado

    const reactionTime = Date.now() - lastWordTimestampRef.current;
    if (reactionTime < 1000) {
      setGlobalStats(prev => ({ ...prev, fastAnswers: prev.fastAnswers + 1 }));
    }

    if (choice === currentWordObj.correct) {
      // Manejo de aciertos
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(prevMax => Math.max(prevMax, newStreak));  // Actualiza máximo si es necesario

      if (lastErrorTimestamp !== null) {
        const recoveryTime = Date.now() - lastErrorTimestamp;
        setGlobalStats(prev => ({
          ...prev,
          recoveryTimes: [...prev.recoveryTimes, recoveryTime],
        }));
        setLastErrorTimestamp(null);
      }
      setScore(score + 1);
    } else {
      // Reinicio de racha en errores
      setStreak(0);
      setErrors(errors + 1);

      if (lastErrorTimestamp === null) {
        setLastErrorTimestamp(Date.now());
      }
    }
    newWord();
  };

  // Evalúa las condiciones del nivel al finalizar el tiempo
  const evaluateLevel = () => {
    const errorPercentage = score + errors > 0 ? ((errors / (score + errors)) * 100) : 0;
    let passed = false;
    if (level === 5) {
      passed = score >= MIN_SCORE_REQUIRED[level] && errors <= 1;
    } else {
      passed = score >= MIN_SCORE_REQUIRED[level] && errorPercentage < ERROR_THRESHOLD[level];
    }

    setGlobalStats(prev => ({
      ...prev,
      totalScore: prev.totalScore + score,
      totalCorrect: prev.totalCorrect + score,
      totalErrors: prev.totalErrors + errors,
    }));
    setStreak(0); // Actualizar la máxima racha

    // Si se pasa el nivel y no es el último, iniciar el temporizador de 10 segundos
    if (passed && level < 5) {
      setNextLevelTimer(10);
    }
    else if (!passed) {
      if (levelFails >= 1) { // Segundo fallo consecutivo
        setIsGameOver(true);
        setGameOver(true);
        return;
      }
      setLevelFails(c => c + 1);
    }
    setLevelPassed(passed);
    setGameOver(true);

    // SOLO termina el juego si es el último nivel
    if (level === 5) {
      setIsGameOver(true);
    }
  };

  // Avanza al siguiente nivel (cuando se vence el temporizador de 10 segundos)
  const advanceLevel = () => {
    setLevel(level + 1);
    setScore(0);
    setErrors(0);
    setTime(LEVEL_TIME[level + 1]);
    setGameOver(false);
    setNextLevelTimer(null);
    setLevelFails(0); // Reinicia al pasar de nivel
  };

  // Reinicia el nivel actual en caso de derrota
  const retryLevel = () => {
    setGameOver(false);  // El juego ya no está en "Game Over"
    setGameStarted(false); // Se detiene el juego mientras se hace la cuenta regresiva
    setCountdown(3); // Inicia en 3 segundos

    let timeLeft = 3;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);

      if (timeLeft === 0) {
        clearInterval(interval);
        setCountdown(null);

        // Reiniciar estados del nivel
        setScore(0);
        setErrors(0);
        setTime(LEVEL_TIME[level]);
        setCurrentWord('');
        setOptions([]);
        setGameStarted(true); // Ahora sí, el juego comienza
        setLevelPassed(false); // Reiniciar el estado de nivel superado

        // Reiniciar referencias de tiempo
        startTimeRef.current = Date.now();
        lastWordTimestampRef.current = Date.now();
        setLastErrorTimestamp(null);
      }
    }, 1000);
  };

  const calculateGameTime = () => {
    const startTime = startTimeRef.current;
    return Math.floor((Date.now() - startTime) / 1000);
  };

  // Interfaz del juego en curso
  return (
    <div className="afin-game-container">
      {gameOver ? (
        <>
          {(levelPassed || isGameOver) ? (
            (level === 5 || isGameOver) ? (
              <div className="afin-fin-juego-container">
                <h1>Fin del juego</h1>
                <div className="afin-stats-table-wrapper">
                  <table className="afin-stats-table">
                    <thead>
                      <tr>
                        <th>⏱️ Tiempo total</th>
                        <th>🎯 Puntaje final</th>
                        <th>🏆 Nivel máximo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{totalTime} s</td>
                        <td>{globalStats.totalCorrect}</td>
                        <td>{level}</td>
                      </tr>
                      <tr>
                        <td>✅ {globalStats.totalCorrect} correctas</td>
                        <td>❌ {globalStats.totalErrors} errores</td>
                        <td>
                          📊 {globalStats.totalCorrect + globalStats.totalErrors > 0
                            ? `${((globalStats.totalCorrect / (globalStats.totalCorrect + globalStats.totalErrors)) * 100).toFixed(2)}%`
                            : "0%"} precisión
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3}>⚡ Respuestas rápidas: {globalStats.fastAnswers}</td>
                      </tr>
                      <tr>
                        <td colSpan={3}>
                          🕒 T. recuperación: {globalStats.recoveryTimes.length > 0
                            ? `${Math.floor(globalStats.recoveryTimes.reduce((acc, t) => acc + t, 0) / globalStats.recoveryTimes.length)} ms`
                            : "N/A"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button onClick={startCountdown}>Jugar de nuevo</button>
              </div>
            ) : (
              <div className="afin-start-screen">
                <h2>¡Nivel superado!</h2>
                <section className="afin-info-row">
                  <div className="stat-item">
                    <strong>Puntaje:</strong> <span>{score}</span>
                  </div>
                  <div className="stat-item">
                    <strong>Errores:</strong> <span>{errors}</span>
                  </div>
                  <div className="stat-item">
                    <strong>Tiempo jugado:</strong> <span>{LEVEL_TIME[level]}s</span>
                  </div>
                </section>
                <p>Pasarás al siguiente nivel en: {nextLevelTimer} segundos</p>
              </div>
            )
          ) : (
            <div className="afin-start-screen">
              <h2>¡Nivel no superado!</h2>
              <section className="afin-info-row">
                <div className="stat-item">
                  <strong>Puntaje:</strong> <span>{score}</span>
                </div>
                <div className="stat-item">
                  <strong>Errores:</strong> <span>{errors}</span>
                </div>
                <div className="stat-item">
                  <strong>Tiempo jugado:</strong> <span>{LEVEL_TIME[level]}s</span>
                </div>
              </section>
              <p>
                {score < MIN_SCORE_REQUIRED[level] ? `No alcanzaste el puntaje mínimo requerido (${MIN_SCORE_REQUIRED[level]}). ` : ''}
                {((errors / (score + errors)) * 100) >= ERROR_THRESHOLD[level] ? `El porcentaje de errores (${((errors / (score + errors)) * 100).toFixed(2)}%) excede el límite permitido (${ERROR_THRESHOLD[level]}%).` : ''}
              </p>
              <button onClick={retryLevel}>Reintentar nivel</button>
              {levelFails === 1 && <p style={{ color: "red" }}>¡Último intento!</p>}
            </div>
          )}
        </>
      ) : !gameStarted ? (
        countdown === null ? (
          <div className="afin-start-screen">
            <h2>¡Bienvenido a A fin!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="afin-countdown">{countdown}</div>
        )
      ) : (
        <div className="afin-game-container">
          <section className="afin-info-row">
            <div className="stat-item">
              <strong>Puntaje:</strong> <span>{score}</span>
            </div>
            <div className="stat-item">
              <strong>Errores:</strong> <span>{errors}</span>
            </div>
            <div className="stat-item">
              <strong>Tiempo:</strong> <span>{time}s</span>
            </div>
          </section>

          <div className="stat-item">
            <strong>Nivel:</strong> <span>{level}</span>
          </div>

          <div className="afin-word-container">
            <h2 className="afin-h2">Palabra objetivo:</h2>
            <h2>{currentWord}</h2>
          </div>

          <div className="afin-options-container">
            {options.map((option, index) => (
              <button key={index} onClick={() => handleChoice(option)}>
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SynonymGame;
