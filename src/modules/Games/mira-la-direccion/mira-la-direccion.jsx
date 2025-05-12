import React, { useState, useEffect } from 'react';
import './mira-la-direccion.css';

const MiraLaDireccion = () => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [totalTime, setTotalTime] = useState(45);
  const [score, setScore] = useState(50);
  const [stars, setStars] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [errorAnswers, setErrorAnswers] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isInputActive, setIsInputActive] = useState(true); // Controla si las teclas están activas
  const [countdown, setCountdown] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' o 'incorrect'

  useEffect(() => {
    setObjects(generateObjects());
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => handleKeyPress(event);

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, isInputActive]);

  // Manejo del temporizador
  useEffect(() => {
    if (!gameStarted) return; // No hacer nada si el juego no ha comenzado
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameStarted(false);
      setGameOver(true);
    }
  }, [timeLeft, gameStarted]);

  const startGame = () => {
    setErrorAnswers(0);
    setGameOver(false);
    setGameStarted(true);
    setTimeLeft(45);
    setScore(50);
    setStars(0);
    setTotalAnswers(0);
    setCorrectAnswers(0);
    setObjects(generateObjects()); // Asegura que objects siempre tiene datos
    setIsInputActive(false); // Bloquea teclas hasta que los objetos estén listos

    setTimeout(() => {
      setIsInputActive(true); // Activa entrada después de inicializar objects
    }, 250);
  };

  const generateObjects = () => {
    const directions = ['↑', '↓', '←', '→'];
    const isCase1 = Math.random() > 0.5;
    const commonDirection = directions[Math.floor(Math.random() * 4)];
    const newObjects = Array(5).fill(commonDirection);

    if (!isCase1) {
      const diffIndex = Math.floor(Math.random() * 5);
      const differentDirection = directions.filter((dir) => dir !== commonDirection)[
        Math.floor(Math.random() * 3)
      ];
      newObjects[diffIndex] = differentDirection;
    }

    return { objects: newObjects, isCase1 };
  };

  const [objects, setObjects] = useState(generateObjects());

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
      }
    }, 1000);
  };

  const handleKeyPress = (event) => {
    if (!isInputActive || gameOver || !objects.objects || objects.objects.length === 0) return;

    setTotalAnswers((prev) => prev + 1);

    const keyToSymbol = {
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
    };

    const pressedKey = keyToSymbol[event.key];
    if (!pressedKey) return;

    let correctDirection = null;

    if (objects.isCase1) {
      correctDirection = objects.objects[0];
    } else {
      const uniqueObjects = objects.objects.filter(
        (item, _, arr) => arr.indexOf(item) === arr.lastIndexOf(item)
      );
      correctDirection = uniqueObjects.length > 0 ? uniqueObjects[0] : objects.objects[0];
    }

    if (!correctDirection) return; // Previene errores

    setIsInputActive(false);

    if (pressedKey === correctDirection) {
      setFeedback('correct'); // Activa el feedback verde
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
      setErrorAnswers((prev) => prev + 1);
      setFeedback('incorrect'); // Puedes manejar un feedback rojo si quieres
      setScore((prev) => prev - 50);
      setConsecutiveCorrect(0);
    }

    // Espera 500ms antes de generar nuevos objetos y limpiar el feedback
    setTimeout(() => {
      setObjects(generateObjects());
      setIsInputActive(true);
      setFeedback(null); // Limpia el feedback para restaurar el color original
    }, 250);
  };

  return (
    <div
      className="mira-game-container"
    >
      {gameOver ? (
        <div className="mira-fin-juego-container">
          <h1>Fin del juego</h1>
          <div className="mira-stats-table-wrapper">
            <table className="mira-stats-table">
              <thead>
                <tr>
                  <th>⏱️ Tiempo total</th>
                  <th>🎯 Puntaje final</th>
                  <th>🏆 Nivel máximo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{totalTime}</td>
                  <td>{score}</td>
                  <td>
                    {totalAnswers}
                  </td>
                </tr>
                <tr>
                  <td>✅ Correctas: {correctAnswers}</td>
                  <td>❌ Errores: {errorAnswers}</td>
                  <td>📊 Precisión: {totalAnswers > 0 ? `${((correctAnswers / totalAnswers) * 100).toFixed(2)}%` : "0%"}</td>
                </tr>
                <tr>
                  <td colSpan={2}>🔁 Total de respuestas: {totalAnswers}</td>
                  <td>⭐ Estrellas: {stars}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={startCountdown}>Jugar de nuevo</button>
        </div>
      ) : !gameStarted ? (
        countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
          <div className="mira-start-screen">
            <h2>¡Bienvenido a Mira la dirección!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="mira-countdown">{countdown}</div>
        )
      ) : (
        <>
          <section className="mira-info-row">
            <div className="stat-item">
              <strong>Puntaje:</strong> <span>{score}</span>
            </div>
            <div className="stat-item">
              <strong>Errores:</strong> <span>{errorAnswers}</span>
            </div>
            <div className="stat-item">
              <strong>Tiempo restante:</strong> <span>{timeLeft}s</span>
            </div>
          </section>

          <div className="mira-grid">
            {Array.isArray(objects.objects) && objects.objects.length > 0 ? (
              objects.objects.map((direction, index) => (
                <div key={index} className={`mira-arrow ${feedback}`}>
                  {direction}
                </div>
              ))
            ) : (
              <p>Cargando...</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MiraLaDireccion;
