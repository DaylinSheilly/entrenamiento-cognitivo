import React, { useState, useEffect } from "react";
import './recuerda-los-objetos.css';

const allObjects = ["🚗", "⭐", "🍎", "⚽", "📖", "✏️", "🌸", "🐕", "☁️", "👟", "🍏", "⚾", "🖊️", "🌺", "🐩", "🧢"];

const MemoryGame = () => {
  const [sequence, setSequence] = useState([]); // Secuencia a recordar
  const [currentLevel, setCurrentLevel] = useState(1); // Nivel actual
  const [showingSequence, setShowingSequence] = useState(true); // Mostrar objetos
  const [playerSelection, setPlayerSelection] = useState([]); // Selecciones del jugador
  const [score, setScore] = useState(0); // Puntuación
  const [gameOver, setGameOver] = useState(false); // Estado final del juego
  const [longestCorrectSequence, setLongestCorrectSequence] = useState(0); // Lapso de memoria
  const [responseTimes, setResponseTimes] = useState([]); // Tiempos de respuesta
  const [omissionErrors, setOmissionErrors] = useState(0); // Errores de omisión
  const [startTime, setStartTime] = useState(null); // Tiempo inicial de respuesta

  useEffect(() => {
    if (currentLevel > 8) {
      setGameOver(true); // Final del juego al superar el nivel 8
      return;
    }

    // Generar secuencia
    const newSequence = allObjects
      .sort(() => 0.5 - Math.random())
      .slice(0, currentLevel + 2);
    setSequence(newSequence);

    setShowingSequence(true);
    const timer = setTimeout(() => {
      setShowingSequence(false);
      setStartTime(Date.now()); // Iniciar tiempo para medir respuesta
    }, 3000 + currentLevel * 500);

    return () => clearTimeout(timer);
  }, [currentLevel]);

  // Manejar selección del jugador
  const handleSelection = (item) => {
    if (!startTime) return; // Evitar respuestas antes de tiempo

    const elapsedTime = Date.now() - startTime; // Tiempo de respuesta
    setResponseTimes((prev) => [...prev, elapsedTime]);
    setPlayerSelection((prev) => [...prev, item]);
  };

  // Verificar selección y errores de omisión
  useEffect(() => {
    if (playerSelection.length > 0 && playerSelection.length === sequence.length) {
      const isCorrect = sequence.every((item, index) => item === playerSelection[index]);

      if (isCorrect) {
        setScore((prevScore) => prevScore + 10);
        setCurrentLevel((prevLevel) => prevLevel + 1);

        // Actualizar lapso de memoria
        if (sequence.length > longestCorrectSequence) {
          setLongestCorrectSequence(sequence.length);
        }
      } else {
        alert("¡Error! Intenta de nuevo.");
      }

      // Calcular errores de omisión como la cantidad de elementos sin respuesta
      const omissions = sequence.length - playerSelection.length;
      setOmissionErrors((prev) => prev + omissions);

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
  }, [showingSequence, playerSelection, sequence]);

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
            <p><strong>Tiempo promedio de respuesta:</strong> {averageResponseTime} ms</p>
            <p><strong>Errores de omisión:</strong> {omissionErrors}</p>
            <button onClick={() => window.location.reload()}>
              Jugar de nuevo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recuerda-objetos-body">
      <div className="recuerda-objetos-juego-contenedor">
        <h1>Recuerda los Objetos</h1>
        <h2>Nivel: {currentLevel}</h2>
        <h2>Puntuación: {score}</h2>
          {showingSequence ? (
            <div className="recuerda-objetos-objetos-contenedor fila-horizontal">
              {sequence.map((item, index) => (
                <span key={index} style={{ margin: "10px" }}>
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div className="recuerda-objetos-objetos-contenedor">
              {[
                ...sequence,
                ...allObjects
                  .filter((item) => !sequence.includes(item)) // Objetos no presentes en la secuencia
                  .sort(() => 0.5 - Math.random())
                  .slice(0, Math.min(currentLevel + 2, allObjects.length - sequence.length)) // Distractores incrementan con el nivel
              ]
                .sort(() => 0.5 - Math.random())
                .map((item, index) => (
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
