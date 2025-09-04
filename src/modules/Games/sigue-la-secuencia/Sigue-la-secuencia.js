import React, { useState, useEffect, useRef } from 'react';
import './Sigue-la-secuencia.css';

const MemoriaSecuencial = ({ onGameEnd }) => {
  // Nuevo estado para la pantalla de inicio
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const [stage, setStage] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0); // racha de aciertos consecutivos
  const [bonusLevel, setBonusLevel] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [maxErrors, setMaxErrors] = useState(2);
  const [currentClicked, setCurrentClicked] = useState(null);
  const [previousClicked, setPreviousClicked] = useState(null);
  const [notification, setNotification] = useState("");

  const [maxMemorySpan, setMaxMemorySpan] = useState(0);
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [correctSequenceCount, setCorrectSequenceCount] = useState(0);
  const [omissionErrors, setOmissionErrors] = useState(0);
  const [sequenceStartTime, setSequenceStartTime] = useState(null);

  // Ref para bloquear entradas mientras se procesa la respuesta actual
  const isProcessingRef = useRef(false);
  // Ref para el timer de error de omisión
  const omissionTimerRef = useRef(null);
  const isHandlingGameEnd = useRef(false);

  const gameData = {
    game_name: "Sigue la secuencia",
    level: stage,
    difficulty: stage <= 3 ? "fácil" : stage <= 6 ? "medio" : "difícil",
    actions_taken: correctSequenceCount + errorCount + omissionErrors,
    accuracy: Math.round(
      (correctSequenceCount /
        (correctSequenceCount + errorCount + omissionErrors)) * 100
    ),
    streaks: correctSequenceCount,
    errors: errorCount + omissionErrors,
    score: score
  };

  const handleGameEnd = () => {
    // Envía los datos al GameLayout
    // console.log("Datos del juego:", gameData);
    onGameEnd(gameData);
  };

  useEffect(() => {
    if (gameOver && !isHandlingGameEnd.current) {
      isHandlingGameEnd.current = true;
      handleGameEnd();
      isHandlingGameEnd.current = false;
    }
  }, [gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) {
      setElapsedTime(0);
      return;
    }
    setElapsedTime(
      gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0
    );

    const interval = setInterval(() => {
      setElapsedTime(
        gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, gameStartTime]);

  useEffect(() => {
    if (gameStarted) {
      generateSequence(stage);
    }
  }, [stage, gameStarted]);

  useEffect(() => {
    if (sequence.length > 0) {
      showSequence();
    }
  }, [sequence]);

  const startCountdown = () => {
    setGameOver(false);
    setGameStarted(false);
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

  const startGame = () => {
    // Resetear todos los estados del juego
    setGameStarted(true);
    setGameOver(false);
    setCountdown(null);
    setStage(1);
    setSequence([]);
    setUserInput([]);
    setScore(0);
    setStars(0);
    setCurrentStreak(0);
    setBonusLevel(0);
    setErrorCount(0);
    setGameStartTime(new Date());
    setHighlightIndex(-1);
    setSelectedIndices([]);
    setCurrentClicked(null);
    setPreviousClicked(null);
    setNotification("");
    setMaxMemorySpan(0);
    setTotalResponseTime(0);
    setCorrectSequenceCount(0);
    setOmissionErrors(0);
    setSequenceStartTime(null);

    // Limpiar timers y referencias
    if (omissionTimerRef.current) clearTimeout(omissionTimerRef.current);
    isProcessingRef.current = false;
    isHandlingGameEnd.current = false;

    // Generar primera secuencia
    generateSequence(1);
  };

  const generateSequence = (currentStage) => {
    const sequenceLength = currentStage + 1;
    let lastNumber = null;
    let secondLastNumber = null;
    const newSequence = [];

    for (let i = 0; i < sequenceLength; i++) {
      let randomNumber;
      do {
        randomNumber = Math.floor(Math.random() * 10);
      } while (randomNumber === lastNumber || randomNumber === secondLastNumber);
      newSequence.push(randomNumber);
      secondLastNumber = lastNumber;
      lastNumber = randomNumber;
    }

    setCurrentClicked(null);
    setPreviousClicked(null);
    setSequence(newSequence);
    setUserInput([]);
    setSelectedIndices([]);
    setHighlightIndex(-1);
  };

  const showSequence = () => {
    let index = 0;
    const timeInterval = Math.max(500, 2000 - stage * 200);
    const intervalId = setInterval(() => {
      setHighlightIndex(sequence[index]);
      index++;
      if (index === sequence.length + 1) {
        clearInterval(intervalId);
        setHighlightIndex(-1);
        // Inicia el tiempo de respuesta cuando se oculta el patrón:
        setSequenceStartTime(new Date());
      }
    }, timeInterval);
  };

  const handleUserInput = (number) => {
    // Si ya se está procesando un input, lo ignoramos
    if (isProcessingRef.current) {
      return;
    }
    isProcessingRef.current = true;

    // Cancelamos el timer de omisión, ya que el usuario está respondiendo
    clearTimeout(omissionTimerRef.current);

    const currentInputIndex = userInput.length;
    const isCorrect = sequence[currentInputIndex] === number;

    const newInput = [...userInput, number];
    setUserInput(newInput);

    setPreviousClicked(currentClicked);
    setCurrentClicked(number);

    if (!isCorrect) {
      setCurrentStreak(0);
      setBonusLevel(0);
      setErrorCount((prevErrors) => {
        const newErrorCount = prevErrors + 1;
        if (newErrorCount >= maxErrors) {
          setTimeout(() => {
            setGameOver(true); // Esto activará el useEffect que llama a handleGameEnd
            isProcessingRef.current = false;
          }, 1000);
        } else {
          setNotification("Has cometido un error, inténtalo de nuevo.");
          setTimeout(() => {
            setNotification("")
            setUserInput([]);
            setSelectedIndices([]);
            generateSequence(stage);
            isProcessingRef.current = false;
          }, 1000);
        }
        return newErrorCount;
      });
    } else if (currentInputIndex + 1 === sequence.length) {
      const newStreak = currentStreak + 1;
      let bonusToAdd = 0;
      let newBonusLevel = bonusLevel;
      const responseTime = new Date() - sequenceStartTime;
      setTotalResponseTime(prev => prev + responseTime);
      setCurrentStreak(prevStreak => {
        const newStreak = prevStreak + 1;
        setScore(prevScore => prevScore + 50);
        if (newStreak % 4 === 0) {
          setStars(prevStars => prevStars + 1);
          newBonusLevel = bonusLevel + 1;
          bonusToAdd = newBonusLevel * 50;
          setBonusLevel(newBonusLevel);
        } else {
          setBonusLevel(bonusLevel); // No cambia, pero asegura consistencia si lo usas en otros lados
        }
        return newStreak;
      });

      setCorrectSequenceCount(prev => prev + 1);
      // Actualiza el lapso de memoria si corresponde
      if (sequence.length > maxMemorySpan) {
        setMaxMemorySpan(sequence.length);
      }
      if (stage === 9) {
        setTimeout(() => {
          setNotification("¡Has completado el juego!");
          setGameOver(true);
          setTimeout(() => setNotification(""), 3000);
          isProcessingRef.current = false;
        }, 1000);
      } else {
        setTimeout(() => {
          setNotification("¡Correcto! Pasas a la siguiente etapa.");
          setErrorCount(0);
          setStage(prevStage => prevStage + 1);
          setTimeout(() => setNotification(""), 3000);
          isProcessingRef.current = false;
        }, 1000);
      }
    } else {
      isProcessingRef.current = false;
      // Reinicia el timer de omisión para la siguiente entrada, si fuera necesario
      omissionTimerRef.current = setTimeout(() => {
        console.log("Error de omisión detectado durante la secuencia parcial.");
        setOmissionErrors(prev => prev + 1);
        generateSequence(stage);
      }, 10000);
    }
  };

  const getCircleClass = (number) => {
    // Ejemplo de función para asignar clases según el estado
    // (Ajusta según la lógica de tu aplicación)
    if (number === currentClicked) {
      return 'circle correct';
    }
    if (number === previousClicked) {
      return '';
    }
    const selected = selectedIndices.find((index) => index.number === number);
    if (highlightIndex === number) {
      return 'highlight';
    }
    return selected ? (selected.isCorrect ? 'correct' : 'incorrect') : '';
  };

  return (
    <div className="memoria-game-container">
      {gameOver ? (
        <div className="memoria-fin-juego-container">
          <h1>Fin del juego</h1>
          <div className="memoria-stats-table-wrapper">
            <table className="memoria-stats-table">
              <thead>
                <tr>
                  <th>⏱️ Tiempo total</th>
                  <th>🎯 Puntaje final</th>
                  <th>🏆 Nivel máximo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{elapsedTime} s</td>
                  <td>{score}</td>
                  <td>{stage}</td>
                </tr>
                <tr>
                  <td>✅ {correctSequenceCount} correctas</td>
                  <td>❌ {errorCount + omissionErrors} errores</td>
                  <td>
                    📊 {(correctSequenceCount + errorCount + omissionErrors) > 0
                      ? ((correctSequenceCount / (correctSequenceCount + errorCount + omissionErrors)) * 100).toFixed(2)
                      : "0"}%
                  </td>
                </tr>
                <tr>
                  <td>⭐ {stars} Estrellas</td>
                  <td>🏅 Racha máxima: {maxMemorySpan}</td>
                  <td>🔥 Mejor racha: {currentStreak}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={startCountdown}>
            Jugar de nuevo
          </button>
        </div>
      ) : !gameStarted ? (
        countdown === null ? (
          <div className="memoria-start-screen">
            <h2>¡Bienvenido a Memoria Secuencial!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="pipe-countdown">{countdown}</div>
        )
      ) : (
        <div className="memoria-app">
          <section className="memoria-info-row">
            <div className="stat-item">
              <strong>Puntaje:</strong> <span>{score}</span>
            </div>
            <div className="stat-item">
              <strong>Errores:</strong> <span>{errorCount + omissionErrors}</span>
            </div>
            <div className="stat-item">
              <strong>Tiempo:</strong> <span>{elapsedTime} s</span>
            </div>
          </section>
          <div className="stat-item">
            <strong>Nivel:</strong> <span>{stage}</span>
          </div>

          <main className="memoria-main">
            <div className="memoria-grid">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <div
                  key={number}
                  className={`memoria-cell ${getCircleClass(number)}`}
                  onClick={() => !gameOver && handleUserInput(number)}>
                  {number}
                </div>
              ))}
            </div>
          </main>
          {notification && (
            <div className="memoria-notification">
              {notification}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoriaSecuencial;
