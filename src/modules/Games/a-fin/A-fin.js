import React, { useState, useEffect } from 'react';
import './AFin.css';

// Declaramos las constantes primero
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
    { target: 'rápido', correct: 'veloz', incorrect: ['lento'] },
    { target: 'feliz', correct: 'contento', incorrect: ['triste'] },
    { target: 'grande', correct: 'enorme', incorrect: ['pequeño'] },
  ],
  2: [
    { target: 'música', correct: 'melodía', incorrect: ['canción'] },
    { target: 'amistad', correct: 'compañerismo', incorrect: ['conocido'] },
    { target: 'inteligente', correct: 'listo', incorrect: ['estudioso'] },
  ],
  3: [
    { target: 'trabajo', correct: 'ocupación', incorrect: ['tarea', 'descanso'] },
    { target: 'honesto', correct: 'íntegro', incorrect: ['mentiroso', 'justo'] },
  ],
  4: [
    // Para nivel 4 se esperan 3 opciones: 1 sinónimo y 2 distractores
    { target: 'valiente', correct: 'intrépido', incorrect: ['cobarde', 'temeroso'] },
    { target: 'curioso', correct: 'inquisitivo', incorrect: ['desinteresado', 'intrigado'] },
  ],
  5: [
    // Para nivel 5 se esperan 4 opciones: 1 sinónimo, 1 antónimo y 2 palabras relacionadas
    { target: 'sabio', correct: 'erudito', incorrect: ['ignorante', 'experto', 'necio'] },
    { target: 'ágil', correct: 'rápido', incorrect: ['lento', 'flexible', 'torpe'] },
  ],
};

const SynonymGame = () => {
  // Ahora las constantes ya están definidas, por lo que podemos usarlas en la inicialización de estados
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [time, setTime] = useState(LEVEL_TIME[1]);
  const [currentWord, setCurrentWord] = useState('');
  const [options, setOptions] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [levelPassed, setLevelPassed] = useState(false);
  const [nextLevelTimer, setNextLevelTimer] = useState(null);

  // Temporizador general del nivel
  useEffect(() => {
    if (time > 0 && !gameOver) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
      return () => clearTimeout(timer);
    } else if (time === 0 && !gameOver) {
      evaluateLevel();
    }
  }, [time, gameOver]);

  // Muestra una nueva palabra cada vez que el nivel está activo
  useEffect(() => {
    if (!gameOver) {
      newWord();
    }
  }, [level, gameOver]);

  // Temporizador para avanzar al siguiente nivel en caso de victoria
  useEffect(() => {
    if (nextLevelTimer === null) return;
    if (nextLevelTimer > 0) {
      const timerId = setTimeout(() => setNextLevelTimer(nextLevelTimer - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (nextLevelTimer === 0 && levelPassed && level < 5) {
      advanceLevel();
    }
  }, [nextLevelTimer, levelPassed, level]);

  const newWord = () => {
    const levelWords = words[level];
    if (!levelWords) return;
    const randomIndex = Math.floor(Math.random() * levelWords.length);
    const wordObj = levelWords[randomIndex];
    const choices = [wordObj.correct, ...wordObj.incorrect].sort(() => Math.random() - 0.5);
    setCurrentWord(wordObj.target);
    setOptions(choices);
  };

  const handleChoice = (choice) => {
    const wordObj = words[level].find(w => w.target === currentWord);
    if (!wordObj) return;
    if (choice === wordObj.correct) {
      setScore(score + 1);
    } else {
      setErrors(errors + 1);
    }
    newWord();
  };

  // Evalúa si se cumplen las condiciones al terminar el tiempo
  const evaluateLevel = () => {
    const errorPercentage = errors > 0 ? (errors / (score + errors)) * 100 : 0;
    let passed = false;
    if (level === 5) {
      // En nivel 5: se debe alcanzar el puntaje mínimo y solo se permite 1 error máximo
      passed = score >= MIN_SCORE_REQUIRED[level] && errors <= 1;
    } else {
      // Para los otros niveles se usa el umbral porcentual
      passed = score >= MIN_SCORE_REQUIRED[level] && errorPercentage < ERROR_THRESHOLD[level];
    }
    setLevelPassed(passed);
    setGameOver(true);
    if (passed && level < 5) {
      setNextLevelTimer(10);
    }
  };

  // Avanza automáticamente al siguiente nivel
  const advanceLevel = () => {
    setLevel(level + 1);
    setScore(0);
    setErrors(0);
    setTime(LEVEL_TIME[level + 1]);
    setGameOver(false);
    setNextLevelTimer(null);
  };

  // Reinicia el nivel actual si no se cumplen las condiciones
  const retryLevel = () => {
    setScore(0);
    setErrors(0);
    setTime(LEVEL_TIME[level]);
    setGameOver(false);
  };

  // Interfaz final según la evaluación del nivel
  if (gameOver) {
    const errorPercentage = errors > 0 ? (errors / (score + errors)) * 100 : 0;
    if (levelPassed) {
      return (
        <div className="afin-centered-game">
          <div className="afin-game-container afin-game-over">
            <h2>¡Nivel superado!</h2>
            <p className="afin-message">Puntaje: {score}</p>
            <p className="afin-message">
              Errores: {errors} ({errorPercentage.toFixed(2)}%)
            </p>
            {level < 5 ? (
              <p className="afin-message">
                Pasarás al siguiente nivel en: {nextLevelTimer} segundos
              </p>
            ) : (
              <p className="afin-message">¡Has completado el juego!</p>
            )}
          </div>
        </div>
      );
    } else {
      let causeMessage = '';
      if (score < MIN_SCORE_REQUIRED[level]) {
        causeMessage += `No alcanzaste el puntaje mínimo requerido (${MIN_SCORE_REQUIRED[level]}). `;
      }
      if (errorPercentage >= ERROR_THRESHOLD[level]) {
        causeMessage += `El porcentaje de errores (${errorPercentage.toFixed(2)}%) excede el límite permitido (${ERROR_THRESHOLD[level]}%).`;
      }
      return (
        <div className="afin-centered-game">
          <div className="afin-game-container afin-game-over">
            <h2>¡Nivel no superado!</h2>
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
