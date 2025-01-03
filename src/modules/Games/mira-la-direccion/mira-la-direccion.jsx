import React, { useState, useEffect } from 'react';
import './mira-la-direccion.css';

const MiraLaDireccion = () => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(50);
  const [level, setLevel] = useState(1);
  const [stars, setStars] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [objects, setObjects] = useState({ objects: [], isCase1: true });
  const [gameOver, setGameOver] = useState(false);

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

  const handleKeyPress = (event) => {
    if (gameOver) return;

    const correctDirection = objects.isCase1
      ? objects.objects[0]
      : objects.objects.find(
          (dir, index, arr) => arr.filter((d) => d === dir).length === 1
        );

    if (event.key === `Arrow${correctDirection}`) {
      setScore((prev) => prev + 50);
      setCorrectCount((prev) => prev + 1);

      if ((correctCount + 1) % 4 === 0) {
        const bonus = 100 + Math.floor((correctCount + 1) / 4) * 50;
        setScore((prev) => prev + bonus);
        setStars((prev) => prev + 1);
        setLevel((prev) => prev + 1);
      }
    } else {
      setErrorCount((prev) => prev + 1);
      setStars((prev) => Math.max(0, prev - 1));
    }

    setObjects(generateObjects());
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }

    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    setObjects(generateObjects());
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (gameOver) {
    return (
      <div className="results-screen">
        <h1>¡Juego Terminado!</h1>
        <p>Puntaje Final: {score}</p>
        <p>Total de Aciertos: {correctCount}</p>
        <p>Total de Errores: {errorCount}</p>
        <p>Nivel Alcanzado: {level}</p>
        <button onClick={() => window.location.reload()}>Reiniciar</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h1>Mira la Dirección</h1>
      <div className="stats">
        <p>Tiempo Restante: {timeLeft}s</p>
        <p>Puntaje: {score}</p>
        <p>Estrellas: {stars}</p>
        <p>Nivel: {level}</p>
      </div>
      <div className="grid">
        {objects.objects && objects.objects.length > 0 ? (
          objects.objects.map((dir, index) => (
            <div key={index} className="arrow">
              {dir}
            </div>
          ))
        ) : (
          <p>Cargando...</p>
        )}
      </div>
    </div>
  );
};

export default MiraLaDireccion;
