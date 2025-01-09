import React, { useState, useEffect } from 'react';
import './que-sentido-tiene.css';
import wordsData from './words.json';

const QueSentidoTiene = () => {
  const [word, setWord] = useState('');
  const [previousWord, setPreviousWord] = useState(null);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(0);

  useEffect(() => {
    generateNewWord();
  }, []);

  const generateNewWord = () => {
    let newWord;
    do {
      const randomIndex = Math.floor(Math.random() * wordsData.length);
      newWord = wordsData[randomIndex];
    } while (newWord.text === (previousWord?.text || ''));

    setPreviousWord(word);
    setWord(newWord);
    setStartTime(Date.now());
  };

  const handleKeyPress = (event) => {
    if (!word) return;

    let isCorrect = false;
    if (event.key === 'ArrowRight' && word.type === 'positive') {
      isCorrect = true;
    } else if (event.key === 'ArrowLeft' && word.type === 'negative') {
      isCorrect = true;
    }

    const reactionTimeForWord = Date.now() - startTime;
    setReactionTime(reactionTimeForWord);

    if (isCorrect) {
      setScore(score + 50);
    } else {
      setErrors(errors + 1);
    }

    generateNewWord();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [word]);

  return (
    <div id="sentido-container">
      <h1 id="sentido-title">¿Qué sentido tiene?</h1>
      <p id="sentido-instructions">Clasifica la palabra como positiva o negativa usando las flechas del teclado:</p>
      <p id="sentido-instructions"><strong>Flecha derecha:</strong> Positiva</p>
      <p id="sentido-instructions"><strong>Flecha izquierda:</strong> Negativa</p>

      <div id="sentido-word">{word.text}</div>

      <div id="sentido-stats">
        <h3>Puntaje: {score}</h3>
        <h3>Errores: {errors}</h3>
        <h3>Tiempo de reacción: {reactionTime} ms</h3>
      </div>
    </div>

  );
};

export default QueSentidoTiene;
