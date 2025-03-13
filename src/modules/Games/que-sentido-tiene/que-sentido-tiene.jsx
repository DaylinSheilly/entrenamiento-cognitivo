import React, { useState, useEffect } from 'react';
import './que-sentido-tiene.css';
import wordsData from './words.json';

const QueSentidoTiene = () => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [word, setWord] = useState('');
  const [previousWord, setPreviousWord] = useState(null);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [stars, setStars] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isInputActive, setIsInputActive] = useState(true); // Controla si las teclas están activas
  const [reactionTime, setReactionTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [totalReactionTime, setTotalReactionTime] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'correct' o 'incorrect'

  // Manejo del temporizador
  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameStarted && timeLeft === 0) {
      setGameStarted(false);
      setGameOver(true);
    }
  }, [timeLeft, gameStarted]);

  useEffect(() => {
    generateNewWord();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => handleKeyPress(event);
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isInputActive, word, consecutiveCorrect]);

  const startGame = () => {
    clearTimeout(countdown); // Detiene cualquier cuenta regresiva previa
    setCountdown(null);

    setWord('');
    setPreviousWord(null);
    setScore(0);
    setErrors(0);
    setStars(0);
    setTotalAnswers(0);
    setCorrectAnswers(0);
    setTimeLeft(45);
    setGameStarted(true);
    setGameOver(false);
    setReactionTime(0);
    setIsGameOver(false);
    setIsInputActive(false);

    generateNewWord()
  };

  const startCountdown = () => {
    setGameOver(false); // Asegurar que se oculta la pantalla de fin de juego
    setCountdown(3); // Inicia en 3 segundos
    let timeLeft = 3;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft === 0) {
        clearInterval(interval);
        setCountdown(null);
        startGame(); // Iniciar el juego cuando llega a 0
        setIsInputActive(true);
      }
    }, 1000);
  };

  const generateNewWord = () => {
    let newWord;
    do {
      const filteredWords = wordsData.filter((w) => w.text !== previousWord?.text);
      newWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
    } while (newWord.text === (previousWord?.text || ''));

    setPreviousWord(word);
    setWord(newWord);
    setStartTime(Date.now()); // Marca el inicio del tiempo de reacción
  };

  const handleKeyPress = (event) => {
    if (!word || isGameOver || timeLeft <= 0 || !isInputActive) return;
    setTotalAnswers((prev) => prev + 1);

    const endTime = Date.now();
    const reactionDuration = (endTime - startTime) / 1000; // Convertir a segundos

    setTotalReactionTime((prev) => prev + reactionDuration);

    // Calcular tiempo de reacción acumulado en relación con los 45 segundos del juego
    setReactionTime((totalReactionTime + reactionDuration) / 45);

    let isCorrect = false;
    if (event.key === 'ArrowRight' && word.type === 'positive') {
      isCorrect = true;
    } else if (event.key === 'ArrowLeft' && word.type === 'negative') {
      isCorrect = true;
    }

    setIsInputActive(false);

    if (isCorrect) {
      setFeedback('correct');
      setCorrectAnswers((prev) => prev + 1);
      const newConsecutive = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutive);
      setScore((prev) => prev + 50);

      if (newConsecutive % 4 === 0) {
        const bonus = 100 + ((newConsecutive / 4 - 1) * 50);
        setScore((prev) => prev + bonus);
        setStars((prev) => prev + 1);
      }
    } else {
      setErrors((prev) => prev + 1);
      setFeedback('incorrect');
    }

    // Espera 250ms antes de generar una nueva palabra y limpiar el feedback
    setTimeout(() => {
      generateNewWord();
      setIsInputActive(true);
      setFeedback(null);
    }, 250);
  };

  return (
    <div className="sentido-game-container">
      {gameOver ? (
        <div className="sentido-fin-juego-container">
          <h1>Fin del juego</h1>
          <p>🎯 Puntaje final: {score}</p>
          <p>✅ Correctas: {correctAnswers} de {totalAnswers}</p>
          <p>📊 Precisión: {totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : "0"}%</p>
          <p>⭐ Estrellas: {stars}</p>
          <p>🕒 Tiempo de reacción promedio: {reactionTime.toFixed(2)}s</p>
          <button onClick={startCountdown}>
            Jugar de nuevo
          </button>
        </div>
      ) : !gameStarted ? (
        countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
          <div className="sentido-start-screen">
            <h2>¡Bienvenido a Mira la dirección!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="sentido-countdown">{countdown}</div>
        )
      ) : (
        <div className={`sentido-objetos-juego-contenedor`}>
          <h3>Puntaje: {score}</h3>
          <h3>Errores: {errors}</h3>
          <div className={`sentido-word ${feedback}`}>{word.text}</div>
          <h3>Tiempo: {timeLeft} segundos</h3>
        </div>
      )};
    </div>
  );
};

export default QueSentidoTiene;
