import React, { useState, useEffect, useRef } from 'react';
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
  1: 10,
  2: 10,
  3: 10,
  4: 10,
  5: 10,
};

const words = {
  1: [
    // Nivel 1: 1 sinónimo y 1 antónimo → 2 opciones
    { target: 'rápido', correct: 'veloz', incorrect: ['lento'] },
    { target: 'feliz', correct: 'contento', incorrect: ['triste'] },
    { target: 'grande', correct: 'enorme', incorrect: ['pequeño'] },
    { target: 'alto', correct: 'elevado', incorrect: ['bajo'] },
    { target: 'fácil', correct: 'sencillo', incorrect: ['difícil'] },
    { target: 'caliente', correct: 'ardiente', incorrect: ['frío'] },
    { target: 'nuevo', correct: 'reciente', incorrect: ['viejo'] },
    { target: 'fuerte', correct: 'robusto', incorrect: ['débil'] },
    { target: 'brillante', correct: 'resplandeciente', incorrect: ['opaco'] },
    { target: 'honesto', correct: 'íntegro', incorrect: ['mentiroso'] },
  ],
  2: [
    // Nivel 2: 1 sinónimo y 1 palabra relacionada → 2 opciones
    { target: 'música', correct: 'melodía', incorrect: ['canción'] },
    { target: 'amistad', correct: 'compañerismo', incorrect: ['conocido'] },
    { target: 'inteligente', correct: 'listo', incorrect: ['estudioso'] },
    { target: 'oscuro', correct: 'sombrío', incorrect: ['nocturno'] },
    { target: 'sencillo', correct: 'simple', incorrect: ['elemental'] },
    { target: 'alegre', correct: 'jovial', incorrect: ['entusiasta'] },
    { target: 'fuerte', correct: 'robusto', incorrect: ['potente'] },
    { target: 'tranquilo', correct: 'calmo', incorrect: ['silencioso'] },
    { target: 'sabroso', correct: 'delicioso', incorrect: ['picante'] },
    { target: 'amable', correct: 'afable', incorrect: ['arrogante'] },
  ],
  3: [
    // Nivel 3: 1 sinónimo y 2 antónimos → 3 opciones
    { target: 'trabajo', correct: 'ocupación', incorrect: ['ocio', 'descanso'] },
    { target: 'honesto', correct: 'íntegro', incorrect: ['mentiroso', 'falso'] },
    { target: 'limpio', correct: 'aseado', incorrect: ['sucio', 'inmundo'] },
    { target: 'fácil', correct: 'sencillo', incorrect: ['difícil', 'complicado'] },
    { target: 'rápido', correct: 'veloz', incorrect: ['lento', 'pausado'] },
    { target: 'alegre', correct: 'jovial', incorrect: ['triste', 'melancólico'] },
    { target: 'fuerte', correct: 'robusto', incorrect: ['débil', 'frágil'] },
    { target: 'claro', correct: 'nítido', incorrect: ['oscuro', 'confuso'] },
    { target: 'amable', correct: 'afable', incorrect: ['grosero', 'rudo'] },
    { target: 'lógico', correct: 'razonable', incorrect: ['ilógico', 'absurdo'] },
  ],
  4: [
    // Nivel 4: 1 sinónimo y 2 distractores (palabras relacionadas)
    { target: 'valiente', correct: 'intrépido', incorrect: ['decidido', 'apasionado'] },
    { target: 'curioso', correct: 'inquisitivo', incorrect: ['observador', 'explorador'] },
    { target: 'moderno', correct: 'contemporáneo', incorrect: ['actual', 'progresista'] },
    { target: 'elegante', correct: 'distinguido', incorrect: ['formal', 'clásico'] },
    { target: 'limpio', correct: 'aseado', incorrect: ['claro', 'luminoso'] },
    { target: 'brillante', correct: 'resplandeciente', incorrect: ['claro', 'vivo'] },
    { target: 'suave', correct: 'sedoso', incorrect: ['apacible', 'ligero'] },
    { target: 'fresco', correct: 'refrescante', incorrect: ['templado', 'agradable'] },
    { target: 'rico', correct: 'sabroso', incorrect: ['comestible', 'nutritivo'] },
    { target: 'ágil', correct: 'diestro', incorrect: ['rápido', 'liviano'] },
  ],
  5: [
    // Nivel 5: 1 sinónimo, 1 antónimo y 2 palabras relacionadas → 4 opciones
    { target: 'sabio', correct: 'erudito', incorrect: ['ignorante', 'experto', 'necio'] },
    { target: 'ágil', correct: 'rápido', incorrect: ['lento', 'flexible', 'torpe'] },
    { target: 'firme', correct: 'resuelto', incorrect: ['inconstante', 'vacilante', 'dudoso'] },
    { target: 'elegante', correct: 'distinguido', incorrect: ['tosco', 'ordinario', 'grosero'] },
    { target: 'valioso', correct: 'preciado', incorrect: ['insignificante', 'común', 'barato'] },
    { target: 'audaz', correct: 'osado', incorrect: ['cauteloso', 'precavido', 'temeroso'] },
    { target: 'sutil', correct: 'tenue', incorrect: ['obvio', 'claro', 'manifiesto'] },
    { target: 'sereno', correct: 'calmo', incorrect: ['nervioso', 'agitado', 'inquieto'] },
    { target: 'rápido', correct: 'veloz', incorrect: ['lento', 'pausado', 'despacio'] },
    { target: 'fértil', correct: 'productivo', incorrect: ['estéril', 'árido', 'vacío'] },
  ],
};

const SynonymGame = () => {
  // Estados de nivel y partida
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);      // Puntaje en el nivel actual
  const [errors, setErrors] = useState(0);      // Errores en el nivel actual
  const [time, setTime] = useState(LEVEL_TIME[1]);
  const [currentWord, setCurrentWord] = useState('');
  const [options, setOptions] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [levelPassed, setLevelPassed] = useState(false);
  const [nextLevelTimer, setNextLevelTimer] = useState(null);

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

  // Temporizador del nivel
  useEffect(() => {
    if (time > 0 && !gameOver) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
      return () => clearTimeout(timer);
    } else if (time === 0 && !gameOver) {
      evaluateLevel();
    }
  }, [time, gameOver]);

  // Cada vez que se active el nivel y no haya finalizado, mostrar una nueva palabra
  useEffect(() => {
    if (!gameOver) {
      newWord();
    }
  }, [level, gameOver]);

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
    const randomIndex = Math.floor(Math.random() * levelWords.length);
    const wordObj = levelWords[randomIndex];
    const choices = [wordObj.correct, ...wordObj.incorrect].sort(() => Math.random() - 0.5);
    setCurrentWord(wordObj.target);
    setOptions(choices);
    lastWordTimestampRef.current = Date.now();
  };

  // Maneja la respuesta del usuario y registra estadísticas de reacción y recuperación de errores
  const handleChoice = (choice) => {
    const wordObj = words[level].find(w => w.target === currentWord);
    if (!wordObj) return;

    const reactionTime = Date.now() - lastWordTimestampRef.current;
    if (reactionTime < 1000) {
      setGlobalStats(prev => ({ ...prev, fastAnswers: prev.fastAnswers + 1 }));
    }

    if (choice === wordObj.correct) {
      // Si hubo un error previo, calcular el tiempo de recuperación
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
      // Si es el primer error en una secuencia, registrar el tiempo de error
      if (lastErrorTimestamp === null) {
        setLastErrorTimestamp(Date.now());
      }
      setErrors(errors + 1);
    }
    newWord();
  };

  // Evalúa las condiciones del nivel al finalizar el tiempo
  const evaluateLevel = () => {
    const errorPercentage = errors > 0 ? (errors / (score + errors)) * 100 : 0;
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
    setLevelPassed(passed);
    setGameOver(true);
    // Si se pasa el nivel y no es el último, iniciar el temporizador de 10 segundos
    if (passed && level < 5) {
      setNextLevelTimer(10);
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
  };

  // Reinicia el nivel actual en caso de derrota
  const retryLevel = () => {
    setScore(0);
    setErrors(0);
    setTime(LEVEL_TIME[level]);
    setGameOver(false);
  };

  // Reinicia el nivel actual en caso de derrota
  const retryGame = () => {
    setLevel(1);
    setScore(0);
    setErrors(0);
    setTime(LEVEL_TIME[1]);
    setCurrentWord('');
    setOptions([]);
    setGameOver(false);
    setLevelPassed(false);
    setNextLevelTimer(null);

    // Reiniciar referencias de tiempo
    startTimeRef.current = Date.now();
    lastWordTimestampRef.current = Date.now();
    setLastErrorTimestamp(null);
  };

  // Interfaz final según la evaluación del nivel
  if (gameOver) {
    const errorPercentage = errors > 0 ? (errors / (score + errors)) * 100 : 0;
    // Si el nivel fue superado
    if (levelPassed) {
      // Si es nivel 5, el juego termina y se muestran las estadísticas globales
      if (level === 5) {
        const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
        // Calcular promedio de tiempo de recuperación (si hay alguno registrado)
        const recoveryAvg =
          globalStats.recoveryTimes.length > 0
            ? Math.floor(
              globalStats.recoveryTimes.reduce((acc, t) => acc + t, 0) /
              globalStats.recoveryTimes.length
            )
            : 0;
        return (
          <div className="afin-centered-game">
            <div className="afin-game-container afin-game-over">
              <h2 className="afin-h2">¡Felicidades, completaste el juego!</h2>
              <p className="afin-message">Tiempo total: {totalTime} segundos</p>
              <p className="afin-message">
                Puntaje final: {globalStats.totalScore + score}
              </p>
              <p className="afin-message">
                Respuestas rápidas (&lt; 1s): {globalStats.fastAnswers}
              </p>
              <p className="afin-message">
                Errores totales: {globalStats.totalErrors + errors}
              </p>
              <p className="afin-message">
                Correctas: {globalStats.totalCorrect + score} / Incorrectas: {globalStats.totalErrors + errors}
              </p>
              <p className="afin-message">
                Promedio de tiempo para recuperarse de un error: {recoveryAvg} ms
              </p>
              <button className="afin-restart-button" onClick={retryGame}>
                Volver a jugar
              </button>
            </div>
          </div>
        );
      } else {
        // Para niveles 1 a 4, mostrar la interfaz de victoria con temporizador para avanzar
        return (
          <div className="afin-centered-game">
            <div className="afin-game-container afin-game-over">
              <h2 className="afin-h2">¡Nivel superado!</h2>
              <p className="afin-message">Puntaje: {score}</p>
              <p className="afin-message">
                Errores: {errors} ({errorPercentage.toFixed(2)}%)
              </p>
              <p className="afin-message">
                Pasarás al siguiente nivel en: {nextLevelTimer} segundos
              </p>
            </div>
          </div>
        );
      }
    } else {
      // Interfaz de derrota: muestra causas y botón para reintentar el nivel
      let causeMessage = '';
      if (score < MIN_SCORE_REQUIRED[level]) {
        causeMessage += `No alcanzaste el puntaje mínimo requerido (${MIN_SCORE_REQUIRED[level]}). `;
      }
      if (errorPercentage >= ERROR_THRESHOLD[level]) {
        causeMessage += `El porcentaje de errores (${errorPercentage.toFixed(
          2
        )}%) excede el límite permitido (${ERROR_THRESHOLD[level]}%).`;
      }
      return (
        <div className="afin-centered-game">
          <div className="afin-game-container afin-game-over">
            <h2 className="afin-h2">¡Nivel no superado!</h2>
            <p className="afin-message">Puntaje: {score}</p>
            <p className="afin-message">
              Errores: {errors} ({errorPercentage.toFixed(2)}%)
            </p>
            <p className="afin-message">{causeMessage}</p>
            <button className="afin-restart-button" onClick={retryLevel}>
              Reintentar nivel
            </button>
          </div>
        </div>
      );
    }
  }

  // Interfaz del juego en curso
  return (
    <div className="afin-body">
      <div className="afin-centered-game">
        <div className="afin-game-container">
          <h2 className="afin-h2">Juego de Sinónimos</h2>
          <div className="afin-game-info">
            <p className="afin-titles">Nivel: {level}</p>
            <p className="afin-titles">Puntaje: {score}</p>
            <p className="afin-titles">Errores: {errors}</p>
            <p className="afin-titles">Tiempo: {time}s</p>
          </div>
          <div className="afin-word-container">
            <h2 className="afin-h2">Palabra objetivo:</h2>
            <p className="afin-target-word">{currentWord}</p>
          </div>
          <div className="afin-options-container">
            {options.map((option, index) => (
              <button
                key={index}
                className="afin-option-button"
                onClick={() => handleChoice(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SynonymGame;
