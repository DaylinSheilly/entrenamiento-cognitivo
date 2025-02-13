import React, { useState, useEffect } from 'react';
import './mira-la-direccion.css';

const MiraLaDireccion = () => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(50);
  const [level, setLevel] = useState(1);
  const [stars, setStars] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [streak, setStreak] = useState(0); // Aciertos consecutivos
  const [feedback, setFeedback] = useState(''); // Indica si la respuesta fue correcta o incorrecta
  const [gameOver, setGameOver] = useState(false);
  const [objects, setObjects] = useState({ objects: [], isCase1: true });
  const [isInputActive, setIsInputActive] = useState(true); // Controla si las teclas están activas

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

  useEffect(() => {
    setObjects(generateObjects());
  }, []);

  const handleKeyPress = (event) => {
    if (!isInputActive || gameOver) return; // Ignora entradas si las teclas están desactivadas o el juego terminó

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
      const uniqueObject = objects.objects.find(
        (item, index, arr) => arr.indexOf(item) === arr.lastIndexOf(item)
      );
      correctDirection = uniqueObject;
    }

    setIsInputActive(false); // Desactiva las entradas del teclado

    if (pressedKey === correctDirection) {
      setScore((prev) => prev + 50);
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak % 4 === 0) {
          setStars((prevStars) => prevStars + 1);
          setLevel((prevLevel) => prevLevel + 1);
        }
        return newStreak;
      });
      setFeedback('correct'); // Indicación visual de acierto
    } else {
      setErrorCount((prev) => prev + 1);
      setStreak(0); // Reinicia la racha si hay un error
      setFeedback('incorrect'); // Indicación visual de error
    }

    setTimeout(() => {
      setFeedback(''); // Limpia el feedback
      setObjects(generateObjects()); // Genera nuevos objetos
      setIsInputActive(true); // Reactiva las entradas del teclado
    }, 250); // Tiempo para mostrar el feedback (1 segundo)
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [objects, gameOver, isInputActive]);

  // Manejo del temporizador
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setGameOver(true);
    }
  }, [timeLeft]);

  const convertDirectionToClass = (dir) => {
    switch (dir) {
      case '↑':
        return 'up';
      case '↓':
        return 'down';
      case '←':
        return 'left';
      case '→':
        return 'right';
      default:
        return '';
    }
  };

  return (
    <div
      className={`mira.game-container ${feedback === 'correct'
        ? 'correct-bg'
        : feedback === 'incorrect'
          ? 'incorrect-bg'
          : ''
        }`}
    >

      <div className="fullscreen-container">
        {!gameOver ? (
          <div className="mira">
            <h1>Mira la Dirección</h1>
            <div className="mira.stats">
              <p>Tiempo Restante: {timeLeft}s</p>
              <p>Puntaje: {score}</p>
              <p>Estrellas: {stars}</p>
              <p>Nivel: {level}</p>
            </div>

            <div className="mira.grid">
              {objects.objects.map((dir, index) => (
                <div key={index} className={`mira arrow ${convertDirectionToClass(dir)}`}>{dir}
                  {/* Los triángulos son visuales; no es necesario mostrar texto */}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mira.end-game">
            <div className="mira">
              <h1>Fin del Juego</h1>
              <p>Puntaje Final: {score}</p>
              <p>Nivel Máximo: {level}</p>
              <p>Aciertos: {correctCount}</p>
              <p>Errores: {errorCount}</p>
              <button onClick={() => window.location.reload()}>Jugar de Nuevo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiraLaDireccion;
