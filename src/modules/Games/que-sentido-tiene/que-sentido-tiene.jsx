import React, { useState, useEffect } from 'react';
import './que-sentido-tiene.css';
import wordsData from './words.json';

const MAX_SCORE = 2000; // Puntaje necesario para finalizar el juego

const QueSentidoTiene = () => {
  const [word, setWord] = useState('');
  const [previousWord, setPreviousWord] = useState(null);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0); // Nuevo estado para el tiempo transcurrido
  const [isGameOver, setIsGameOver] = useState(false);

  // Inicia el temporizador ascendente
  useEffect(() => {
    let timer;
    if (!isGameOver) {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000); // Actualiza cada segundo
    }
    return () => clearInterval(timer); // Limpia el temporizador al desmontar
  }, [isGameOver]);

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
    if (!word || isGameOver) return;

    let isCorrect = false;
    if (event.key === 'ArrowRight' && word.type === 'positive') {
      isCorrect = true;
    } else if (event.key === 'ArrowLeft' && word.type === 'negative') {
      isCorrect = true;
    }

    const reactionTimeForWord = Date.now() - startTime;
    setReactionTime(reactionTimeForWord);

    if (isCorrect) {
      const newScore = score + 50;
      setScore(newScore);

      if (newScore >= MAX_SCORE) {
        setIsGameOver(true); // Finaliza el juego si se alcanza el puntaje máximo
      }
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
  }, [word, score, isGameOver]);

  const resetGame = () => {
    setWord('');
    setPreviousWord(null);
    setScore(0);
    setErrors(0);
    setStartTime(null);
    setReactionTime(0);
    setElapsedTime(0); // Reinicia el tiempo transcurrido
    setIsGameOver(false);
    generateNewWord();
  };

  if (isGameOver) {
    return (
      <div id="sentido-container">
        <h1 id="sentido-title">¡Juego terminado!</h1>
        <p id="sentido-summary">¡Felicidades! Has alcanzado el puntaje máximo.</p>
        <div id="sentido-stats">
          <h3>Puntaje final: {score}</h3>
          <h3>Errores totales: {errors}</h3>
          <h3>Tiempo total: {elapsedTime} segundos</h3>
          <h3>Tiempo promedio de reacción: {reactionTime} ms</h3>
        </div>
        <button id="sentido-restart-btn" onClick={resetGame}>
          Jugar de nuevo
        </button>
      </div>
    );
  }

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
        <h3>Tiempo: {elapsedTime} segundos</h3>
      </div>
    </div>
  );
};

export default QueSentidoTiene;
