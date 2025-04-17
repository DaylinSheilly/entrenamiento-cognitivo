import React, { useState, useEffect, useRef } from 'react';
import './Sigue-la-secuencia.css';

const MemoriaSecuencial = ({ onGameEnd }) => {
  // Nuevo estado para la pantalla de inicio
  const [gameStarted, setGameStarted] = useState(false);

  const [stage, setStage] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [errorCount, setErrorCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
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
    score: maxMemorySpan * 100 + correctSequenceCount * 10
  };

  const handleGameEnd = () => {
    // Envía los datos al GameLayout
    onGameEnd(gameData);
  };

  useEffect(() => {
    if (isGameOver) {
      clearTimeout(omissionTimerRef.current);
      handleGameEnd(); // ← Función que envia los datos del juego al backend
    }
  }, [isGameOver]);

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

    console.log(newSequence);
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
      setErrorCount((prevErrors) => {
        const newErrorCount = prevErrors + 1;
        if (newErrorCount >= maxErrors) {
          setTimeout(() => {
            setIsGameOver(true); // Esto activará el useEffect que llama a handleGameEnd
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
      // Calcula el tiempo de respuesta para esta secuencia
      const responseTime = new Date() - sequenceStartTime;
      setTotalResponseTime(prev => prev + responseTime);
      setCorrectSequenceCount(prev => prev + 1);
      // Actualiza el lapso de memoria si corresponde
      if (sequence.length > maxMemorySpan) {
        setMaxMemorySpan(sequence.length);
      }
      if (stage === 9) {
        setTimeout(() => {
          setNotification("¡Has completado el juego!");
          setIsGameOver(true);
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

  // Si el juego no ha empezado, muestra la pantalla de inicio.
  if (!gameStarted) {
    return (
      <div className="start-screen-secuencial">
        <h1>Memoria Secuencial</h1>
        <button
          className="start-button-secuencial"
          onClick={() => {
            setGameStarted(true);
            setGameStartTime(new Date());
          }}
        >
          Empezar a jugar
        </button>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="game-over-screen-secuancial">
        <h1>Juego terminado</h1>
        <p>Has cometido dos errores. Inténtalo de nuevo.</p>
        <div className="game-stats">
          <p>
            <strong>Lapso de memoria:</strong> {maxMemorySpan > 10 ? 10 : maxMemorySpan}
          </p>
          <p>
            <strong>Tiempo de respuesta:</strong> {correctSequenceCount > 0 ? Math.round(totalResponseTime / correctSequenceCount) : 0} ms
          </p>
          <p>
            <strong>Errores de omisión:</strong> {omissionErrors}
          </p>
        </div>
        <button
          className="restart-button-secuancial"
          onClick={() => {
            // Reiniciar todos los estados
            setStage(1);
            setErrorCount(0);
            setIsGameOver(false);
            setMaxMemorySpan(0);
            setTotalResponseTime(0);
            setCorrectSequenceCount(0);
            setOmissionErrors(0);
            setGameStartTime(new Date());
            generateSequence(1);
          }}
        >
          Reiniciar juego
        </button>
      </div>
    );
  }

  return (
    <div className="centered-game-secuencia">
      {/* Si hay mensaje de notificación, se muestra en un contenedor especial */}
      <div className="game-container-secuancial">
        <h1>Memoria Secuencial</h1>
        <p>Etapa: {stage}</p>
        <div className="circle-container-secuancial">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <div
              key={number}
              className={`circle-secuancial ${getCircleClass(number)}`}
              onClick={() => highlightIndex === -1 && handleUserInput(number)}
            >
              {number}
            </div>
          ))}
        </div>
      </div>
      {notification && (
        <div className="secuencia-notification">
          {notification}
        </div>
      )}
    </div>
  );
};

export default MemoriaSecuencial;
