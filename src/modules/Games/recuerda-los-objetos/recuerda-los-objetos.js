import React, { useState, useEffect } from "react";
import './recuerda-los-objetos.css'

// Objetos iniciales
const initialObjects = ["🚗", "⭐", "🍎", "⚽", "📖", "✏️", "🌸", "🐕", "☁️", "👟"];

const MemoryGame = () => {
  const [sequence, setSequence] = useState([]); // Secuencia a recordar
  const [currentLevel, setCurrentLevel] = useState(1); // Nivel actual
  const [showingSequence, setShowingSequence] = useState(true); // Mostrar objetos
  const [playerSelection, setPlayerSelection] = useState([]); // Selecciones del jugador
  const [distractors, setDistractors] = useState([]); // Distractores
  const [score, setScore] = useState(0); // Puntuación

  // Configuración inicial de cada ronda
  useEffect(() => {
    const newSequence = initialObjects
      .sort(() => 0.5 - Math.random())
      .slice(0, currentLevel + 2);
    setSequence(newSequence);

    const remainingObjects = initialObjects.filter(
      (item) => !newSequence.includes(item)
    );
    setDistractors(
      remainingObjects.sort(() => 0.5 - Math.random()).slice(0, newSequence.length)
    );

    setShowingSequence(true);
    const timer = setTimeout(() => setShowingSequence(false), 3000 + currentLevel * 500);

    return () => clearTimeout(timer);
  }, [currentLevel]);

  // Manejar selección del jugador
  const handleSelection = (item) => {
    setPlayerSelection((prev) => [...prev, item]);
  };

  // Verificar selección al completar la secuencia
  useEffect(() => {
    if (playerSelection.length === sequence.length) {
      if (JSON.stringify(playerSelection) === JSON.stringify(sequence)) {
        setScore(score + 10);
        setCurrentLevel(currentLevel + 1);
      } else {
        alert("¡Error! Intenta de nuevo.");
      }
      setPlayerSelection([]);
    }
  }, [playerSelection]);

  return (
    <div className="recuerda-objetos-body">
      <div className="recuerda-objetos-juego-contenedor">
        <h1>Recuerda los Objetos</h1>
        <h2>Nivel: {currentLevel}</h2>
        <h2>Puntuación: {score}</h2>
        <div className="recuerda-objetos-objetos-contenedor">
          {showingSequence ? (
            <div>
              {sequence.map((item, index) => (
                <span key={index} style={{ margin: "10px" }}>
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <div>
              {[...sequence, ...distractors]
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
        </div>
        <div className="recuerda-objetos-marcadores">
          <div className="recuerda-objetos-marcador-item">Nivel: {currentLevel}</div>
          <div className="recuerda-objetos-marcador-item">Puntuación: {score}</div>
        </div>
      </div>
    </div>
  );
};

export default MemoryGame;