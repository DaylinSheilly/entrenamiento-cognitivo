import React, { useState, useEffect } from 'react';
import './AFin.css';

const SynonymGame = () => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [time, setTime] = useState(60);
  const [currentWord, setCurrentWord] = useState('');
  const [options, setOptions] = useState([]);
  const [gameOver, setGameOver] = useState(false);

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
      { target: 'valiente', correct: 'intrépido', incorrect: ['cobarde', 'temeroso', 'prudente'] },
      { target: 'curioso', correct: 'inquisitivo', incorrect: ['desinteresado', 'intrigado', 'escéptico'] },
    ],
    5: [
      { target: 'sabio', correct: 'erudito', incorrect: ['ignorante', 'experto', 'necio'] },
      { target: 'ágil', correct: 'rápido', incorrect: ['lento', 'flexible', 'torpe'] },
    ],
  };

  useEffect(() => {
    if (time > 0 && !gameOver) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
      return () => clearTimeout(timer);
    } else if (time === 0) {
      setGameOver(true);
    }
  }, [time, gameOver]);

  useEffect(() => {
    if (!gameOver) {
      newWord();
    }
  }, [level, gameOver]);

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
      if (score % 5 === 0 && level < 5) {
        setLevel(level + 1);
        setTime(LEVEL_TIME[level + 1]);
      }
    } else {
      setErrors(errors + 1);
    }
    newWord();
  };

  const restartGame = () => {
    setLevel(1);
    setScore(0);
    setErrors(0);
    setTime(60);
    setGameOver(false);
  };

  const errorPercentage = errors > 0 ? (errors / (score + errors)) * 100 : 0;

  if (gameOver) {
    const passed = errorPercentage < ERROR_THRESHOLD[level];
    return (
      <div className="afin-centered-game">
        <div className="afin-game-container afin-game-over">
          <h2>¡Juego terminado!</h2>
          <p className="afin-message">Tu puntuación final es: {score}</p>
          <p className="afin-message">Errores: {errors} ({errorPercentage.toFixed(2)}%)</p>
          <p className="afin-message">{passed ? '¡Has pasado el nivel!' : 'No has pasado el nivel, inténtalo de nuevo.'}</p>
          <button className="afin-restart-button" onClick={restartGame}>Jugar de nuevo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="afin-body">
      <div className="afin-centered-game">
        <div className="afin-game-container">
          <h2 className="afin-h2">Juego de Sinónimos</h2>
          <div className="afin-game-info">
            <p className="afin-titles">Nivel: {level}</p>
            <p className="afin-titles">Puntuación: {score}</p>
            <p className="afin-titles">Errores: {errors}</p>
            <p className="afin-titles">Tiempo: {time}s</p>
          </div>
          <div className="afin-word-container">
            <h2 className="afin-h2">Palabra objetivo:</h2>
            <p className="afin-target-word">{currentWord}</p>
          </div>
          <div className="afin-options-container">
            {options.map((option, index) => (
              <button key={index} className="afin-option-button" onClick={() => handleChoice(option)}>
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