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
  const [totalScore, setTotalScore] = useState(0);      // Puntaje en la partida
  const [totalErrors, setTotalErrors] = useState(0);      // Errores en la partida
  const [time, setTime] = useState(LEVEL_TIME[1]);
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

  // Ref para guardar la hora de inicio de la partida y de cada palabra
  const startTimeRef = useRef(Date.now());
  const lastWordTimestampRef = useRef(Date.now());
  const [lastErrorTimestamp, setLastErrorTimestamp] = useState(null);
  const prevWordRef = useRef(null); // Ref para guardar la palabra anterior

  const gameData = {
    game_name: "A fin",
    level: level,
    difficulty: level <= 2 ? "fácil" : level <= 4 ? "medio" : "difícil",
    actions_taken: totalScore + totalErrors,
    accuracy: Math.round(
      (totalScore /
        (totalScore + totalErrors)) * 100
    ),
    streaks: maxStreak,
    errors: totalErrors,
    score: totalScore,
  };

  const handleGameEnd = () => {
    // Envía los datos al GameLayout
    onGameEnd(gameData);
  };

  useEffect(() => {
    if (isGameOver) {
      handleGameEnd(); // ← Función que envia los datos del juego al backend
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
    setTotalScore(0);
    setTotalErrors(0);
    setStreak(0);
    setMaxStreak(0);
    setTime(LEVEL_TIME[1]);
    setCurrentWord('');
    setOptions([]);
    setGameOver(false);
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

  // Estados para estadísticas globales (se acumulan entre niveles)
  const [globalStats, setGlobalStats] = useState({
    totalScore: 0,
    totalErrors: 0,
    totalCorrect: 0,
    fastAnswers: 0,         // Respuestas hechas en menos de 1 segundo
    recoveryTimes: [],      // Array de tiempos de recuperación tras un error
  });


  // Temporizador del nivel
  useEffect(() => {
    if (countdown !== null) return; // Si hay cuenta regresiva, no restar tiempo

    if (time > 0 && !gameOver && gameStarted) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
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
      setTotalScore(totalScore + 1);
      console.log(`Correcto! Racha actual: ${newStreak}`);
    } else {
      // Reinicio de racha en errores
      setStreak(0);
      setErrors(errors + 1);
      setTotalErrors(totalErrors + 1);

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
      // Para el nivel 5: se requiere alcanzar el mínimo y tener máximo 1 error.
      passed = score >= MIN_SCORE_REQUIRED[level] && errors <= 1;
    } else {
      passed = score >= MIN_SCORE_REQUIRED[level] && errorPercentage < ERROR_THRESHOLD[level];
    }
    // Acumular estadísticas globales del nivel actual
    setGlobalStats(prev => ({
      ...prev,
      totalScore: prev.totalScore + score,
      totalErrors: prev.totalErrors + errors,
      totalCorrect: prev.totalCorrect + score,
    }));

    // Si se pasa el nivel y no es el último, iniciar el temporizador de 10 segundos
    if (passed && level < 5) {
      setNextLevelTimer(10);
      setLevelFails(0); // Reiniciar contador al pasar nivel
    }
    else if (!passed) {
      if (levelFails >= 1) { // Segundo fallo consecutivo
        setIsGameOver(true);
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
              <div className="colores-fin-juego-container">
                <h1>Fin del juego</h1>
                <p>🕒 Tiempo total de juego: {calculateGameTime()} segundos</p>
                <p>✅ Correctas: {globalStats.totalCorrect} de {globalStats.totalCorrect + globalStats.totalErrors}</p>
                <p>❌ Errores: {globalStats.totalErrors}</p>
                <p>📊 Precisión: {globalStats.totalCorrect + globalStats.totalErrors > 0
                  ? ((globalStats.totalCorrect / (globalStats.totalCorrect + globalStats.totalErrors)) * 100).toFixed(2)
                  : "0"}%</p>
                <p>⚡ Respuestas rápidas (&lt; 1s): {globalStats.fastAnswers}</p>
                <p>🕒 Tiempo de recuperación: {globalStats.recoveryTimes.length > 0
                  ? Math.floor(globalStats.recoveryTimes.reduce((acc, t) => acc + t, 0) / globalStats.recoveryTimes.length)
                  : "0"} ms</p>
                <button onClick={startCountdown}>Jugar de nuevo</button>
              </div>
            ) : (
              <div className="afin-start-screen">
                <h2>¡Nivel superado!</h2>
                <p>Puntaje: {score}</p>
                <p>Errores: {errors} ({score + errors > 0 ? ((errors / (score + errors)) * 100).toFixed(2) : "0"}%)</p>
                <p>Pasarás al siguiente nivel en: {nextLevelTimer} segundos</p>
              </div>
            )
          ) : (
            <div className="afin-start-screen">
              <h2>¡Nivel no superado!</h2>
              <p>Puntaje: {score}</p>
              <p>Errores: {errors} ({score + errors > 0 ? ((errors / (score + errors)) * 100).toFixed(2) : "0"}%)</p>
              <p>
                {score < MIN_SCORE_REQUIRED[level] ? `No alcanzaste el puntaje mínimo requerido (${MIN_SCORE_REQUIRED[level]}). ` : ''}
                {((errors / (score + errors)) * 100) >= ERROR_THRESHOLD[level] ? `El porcentaje de errores (${((errors / (score + errors)) * 100).toFixed(2)}%) excede el límite permitido (${ERROR_THRESHOLD[level]}%).` : ''}
              </p>
              <button onClick={retryLevel}>Reintentar nivel</button>
              {levelFails === 1 && (
                <p style={{ color: "red" }}>¡Último intento!</p>
              )}
            </div>
          )}
        </>
      ) : !gameStarted ? (
        countdown === null ? (
          <div className="colores-start-screen">
            <h2>¡Bienvenido a A fin!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="colores-countdown">{countdown}</div>
        )
      ) : (
        <div className="afin-game-container">
          <div className="afin-game-info">
            <p>Nivel: {level}</p>
            <p>Puntaje: {score}</p>
            <p>Errores: {errors}</p>
            <p>Tiempo: {time}s</p>
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
