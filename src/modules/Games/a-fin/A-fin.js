import React, { useState, useEffect } from 'react';
import './AFin.css';

const SynonymGame = () => {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [currentWord, setCurrentWord] = useState('');
  const [options, setOptions] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  const words = {
    1: [
      { target: 'área', correct: 'superficie', incorrect: 'triste' },
      { target: 'feliz', correct: 'contento', incorrect: 'enojado' },
      { target: 'rápido', correct: 'veloz', incorrect: 'lento' },
      { target: 'grande', correct: 'enorme', incorrect: 'pequeño' },
      { target: 'frío', correct: 'gélido', incorrect: 'caliente' },
    ],
    2: [
      { target: 'área', options: ['superficie', 'lugar'] },
      { target: 'rápido', options: ['veloz', 'ágil'] },
      { target: 'feliz', options: ['contento', 'alegre'] },
      { target: 'inteligente', options: ['listo', 'sagaz'] },
      { target: 'bonito', options: ['hermoso', 'bello'] },
    ]
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
    const randomIndex = Math.floor(Math.random() * levelWords.length);
    const wordObj = levelWords[randomIndex];

    setCurrentWord(wordObj.target);
    
    if (level === 1) {
      setOptions([wordObj.correct, wordObj.incorrect].sort(() => Math.random() - 0.5));
    } else {
      setOptions(wordObj.options.sort(() => Math.random() - 0.5));
    }
  };

  const handleChoice = (choice) => {
    if (level === 1) {
      if (choice === words[1].find(w => w.target === currentWord).correct) {
        setScore(score + 1);
        if (score + 1 >= 5) {
          setLevel(2);
        }
      }
    } else {
      if (choice === words[2].find(w => w.target === currentWord).options[0]) {
        setScore(score + 1);
      }
    }
    newWord();
  };

  const restartGame = () => {
    setLevel(1);
    setScore(0);
    setTime(60);
    setGameOver(false);
  };

  if (gameOver) {
    return (
      <div className="game-container game-over">
        <h2>¡Juego terminado!</h2>
        <p>Tu puntuación final es: {score}</p>
        <button className="restart-button" onClick={restartGame}>Jugar de nuevo</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h2>Juego de Sinónimos</h2>
      <div className="game-info">
        <p>Nivel: {level}</p>
        <p>Puntuación: {score}</p>
        <p>Tiempo: {time}s</p>
      </div>
      <div className="word-container">
        <h3>Palabra objetivo:</h3>
        <p className="target-word">{currentWord}</p>
      </div>
      <div className="options-container">
        {options.map((option, index) => (
          <button key={index} className="option-button" onClick={() => handleChoice(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SynonymGame;