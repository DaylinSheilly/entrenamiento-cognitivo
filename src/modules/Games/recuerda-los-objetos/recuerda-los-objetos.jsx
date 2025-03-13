import React, { useState, useEffect } from "react";
import './recuerda-los-objetos.css';

const allObjects = ["🚗", "⭐", "🍎", "⚽", "📖", "✏️", "🌸", "🐕", "☁️", "👟", "🍏", "⚾", "🖊️", "🌺", "🐩", "🧢"];

const MemoryGame = () => {
  const [sequence, setSequence] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showingSequence, setShowingSequence] = useState(true);
  const [playerSelection, setPlayerSelection] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [longestCorrectSequence, setLongestCorrectSequence] = useState(0);
  const [currentCorrectSequence, setCurrentCorrectSequence] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [omissionErrors, setOmissionErrors] = useState(0);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    if (currentLevel > 8) {
      setGameOver(true);
      return;
    }

    const newSequence = allObjects
      .sort(() => 0.5 - Math.random())
      .slice(0, currentLevel + 2);
    console.log(newSequence);
    setSequence(newSequence);

    setShowingSequence(true);
    const sequenceTimer = setTimeout(() => {
      setShowingSequence(false);
      setStartTime(Date.now());
    }, 3000 + currentLevel * 500);

    return () => clearTimeout(sequenceTimer);
  }, [currentLevel]);

  // Timer para respuestas omitidas (solo cuando se muestran distractores)
  useEffect(() => {
    if (!showingSequence && sequence.length > 0) {
      const missedTimer = setTimeout(() => {
        // Registra omisión por cada elemento que falte responder
        const omissions = sequence.length - playerSelection.length;
        setOmissionErrors(prev => prev + omissions);
        setPlayerSelection([]);
      }, 5000 + currentLevel * 500);

      return () => clearTimeout(missedTimer);
    }
  }, [showingSequence, playerSelection, sequence, currentLevel]);

  // Manejar selección del jugador
  const handleSelection = (item) => {
    if (!startTime) return;

    // Calcula tiempo de respuesta y actualiza promedios usando handleAnswer
    handleAnswer();
    setPlayerSelection(prev => [...prev, item]);
  };

  const handleCorrectAnswer = () => {
    setCurrentCorrectSequence(prev => prev + 1);
    // Se usa el callback para asegurarnos de que se actualice correctamente el valor
    setLongestCorrectSequence(prev => Math.max(prev, currentCorrectSequence + 1));
  };

  const handleIncorrectAnswer = () => {
    setCurrentCorrectSequence(0);
  };

  // Registra el tiempo de respuesta y actualiza la lista y el promedio
  const handleAnswer = () => {
    const responseTime = Date.now() - startTime;
    setResponseTimes(prev => {
      const newTimes = [...prev, responseTime];
      const avgTime = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
      setAverageResponseTime(avgTime);
      return newTimes;
    });
  };

  // Verifica la respuesta completa del usuario
  useEffect(() => {
    if (playerSelection.length > 0 && playerSelection.length === sequence.length) {
      const isCorrect = sequence.every((item, index) => item === playerSelection[index]);

      if (isCorrect) {
        handleCorrectAnswer();
        setScore(prev => prev + 10);
        setCurrentLevel(prev => prev + 1);
      } else {
        handleIncorrectAnswer();
        alert("¡Error! Intenta de nuevo.");
      }
      // Se puede calcular omisiones si es necesario
      const omissions = sequence.length - playerSelection.length;
      setOmissionErrors(prev => prev + omissions);

      setPlayerSelection([]);
    }
  }, [playerSelection, sequence]);

  // Calcular omisiones por tiempo agotado
  useEffect(() => {
    if (!showingSequence && sequence.length > 0) {
      const timer = setTimeout(() => {
        const omissions = sequence.length - playerSelection.length;
        setOmissionErrors((prev) => prev + omissions);
        setPlayerSelection([]);
      }, 5000 + currentLevel * 500); // Tiempo permitido antes de registrar omisiones

      return () => clearTimeout(timer);
    }
  }, [showingSequence, playerSelection, sequence, currentLevel]);

  // Pantalla de resultados finales
  if (gameOver) {
    const averageResponseTime =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

    return (
      <div className="recuerda-objetos-body">
        <div className="recuerda-objetos-juego-contenedor">
          <div className="recuerda-objetos-fin-juego">
            <h1>¡Felicidades! Has completado el juego</h1>
            <h2>Resultados finales:</h2>
            <p><strong>Nivel máximo alcanzado:</strong> {currentLevel - 1}</p>
            <p><strong>Puntuación total:</strong> {score}</p>
            <p><strong>Lapso de memoria:</strong> {longestCorrectSequence}</p>
            <p><strong>Tiempo promedio de respuesta:</strong> {averageResponseTime.toFixed(2)} ms</p>
            <p><strong>Errores de omisión:</strong> {omissionErrors}</p>
            <button onClick={() => window.location.reload()}>
              Jugar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Cuando se muestran los distractores, calcular la cuadrícula de forma dinámica:
  // 1. Se filtran los objetos que no están en la secuencia.
  // 2. Se mezclan y se limita la cantidad según el nivel.
  // 3. Se combinan con la secuencia y se mezclan nuevamente.
  // 4. Se calcula el número de columnas como la raíz cuadrada redondeada hacia arriba.
  const distractors = allObjects
    .filter((item) => !sequence.includes(item))
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(currentLevel + 2, allObjects.length - sequence.length));
  const gridItems = [...sequence, ...distractors].sort(() => 0.5 - Math.random());
  const gridColumns = Math.ceil(Math.sqrt(gridItems.length));

  return (
    <div className="recuerda-objetos-body">
      <div className="recuerda-objetos-juego-contenedor">
        <h1>Recuerda los Objetos</h1>
        {showingSequence ? (
          <div className="recuerda-objetos-objetos-contenedor fila-horizontal">
            {sequence.map((item, index) => (
              <span key={index} style={{ margin: "0px", fontSize: "1.6em" }}>
                {item}
              </span>
            ))}
          </div>
        ) : (
          <div
            className="recuerda-objetos-objetos-contenedor"
            style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
          >
            {gridItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelection(item)}
                className="recuerda-objetos-objeto"
              >
                {item}
              </button>
            ))}
          </div>
        )}
        <div className="recuerda-objetos-marcadores">
          <div className="recuerda-objetos-marcador-item">Nivel: {currentLevel}</div>
          <div className="recuerda-objetos-marcador-item">Puntuación: {score}</div>
        </div>
      </div>
    </div>
  );
};

export default MemoryGame;
