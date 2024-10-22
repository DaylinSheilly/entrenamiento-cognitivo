import React, { useState, useEffect } from "react";
import "./Memoria.css"; // Asegúrate de tener los estilos para tu juego

const SQUARE_SIZE = 80;
const displayTime = 1; // Tiempo que se muestra la secuencia
const maxLevel = 9;

const MemoryGame = () => {
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(2); // Tamaño inicial de la cuadrícula
  const [sequence, setSequence] = useState([]);
  const [selected, setSelected] = useState([]);
  const [message, setMessage] = useState("Memoriza la secuencia");
  const [showSequence, setShowSequence] = useState(true);
  const [isClickable, setIsClickable] = useState(false); // Control para evitar clics durante la secuencia
  const [error, setError] = useState(false); // Controla si hubo un error

  // Genera una nueva secuencia de cuadrados
  const generateSequence = (gridSize) => {
    const newSequence = [];
    while (newSequence.length < gridSize) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      const newSquare = `${row}-${col}`;
      if (!newSequence.includes(newSquare)) {
        newSequence.push(newSquare);
      }
    }
    return newSequence;
  };

  // Inicializa el juego con la secuencia cuando el nivel cambia
  useEffect(() => {
    if (!error) {
      // Solo genera nueva secuencia al cambiar de nivel o cuando se reinicia el juego
      const newSequence = generateSequence(gridSize);
      setSequence(newSequence);
    }

    setSelected([]);
    setIsClickable(false); // Desactivar clics mientras se muestra la secuencia

    // Mostrar la secuencia por un corto período y luego ocultarla
    setShowSequence(true);
    setMessage("Memoriza la secuencia");
    setTimeout(() => {
      setShowSequence(false);
      setMessage("Selecciona los cuadrados correctos.");
      setIsClickable(true); // Activar clics después de mostrar la secuencia
    }, displayTime * 1000);
  }, [level, gridSize, error]);

  // Manejar la selección del usuario
  const handleSquareClick = (row, col) => {
    const clickedSquare = `${row}-${col}`;
    if (!isClickable) return; // Evitar clics durante la secuencia
    // Evitar clics duplicados en el mismo cuadrado
    if (selected.includes(clickedSquare)) return;

    setSelected([...selected, clickedSquare]);
  };

  // Comparar la selección del usuario con la secuencia sin importar el orden
  const arraysEqual = (arr1, arr2) => {
    return arr1.length === arr2.length && arr1.every((value) => arr2.includes(value));
  };

  const handleUserSelection = () => {
    if (arraysEqual(selected, sequence)) {
      // Si la secuencia es correcta, sube de nivel
      advanceLevel();
    } else {
      // Si la secuencia es incorrecta, vuelve a mostrar la misma secuencia
      handleIncorrectSelection();
    }
  };

  // Manejar el avance de nivel
  const advanceLevel = () => {
    setMessage(`¡Felicidades! Pasas al nivel ${level + 1}`);
    setLevel(level + 1);
    setGridSize(gridSize + 1);
    setSelected([]);
    setError(false); // Reiniciar el estado de error para el nuevo nivel
    const newSequence = generateSequence(gridSize + 1);
    setSequence(newSequence); // Generar nueva secuencia solo al avanzar de nivel

    // Después de un corto tiempo, muestra la nueva secuencia para el nuevo nivel
    setTimeout(() => {
      setMessage("Memoriza la secuencia");
      setShowSequence(true);
      setIsClickable(false); // Desactivar clics mientras se muestra la nueva secuencia
      setTimeout(() => {
        setShowSequence(false);
        setMessage("Selecciona los cuadrados correctos.");
        setIsClickable(true); // Activar clics después de mostrar la secuencia
      }, displayTime * 1000);
    }, 1000);
  };

  // Manejar el caso de una selección incorrecta
  const handleIncorrectSelection = () => {
    setMessage("¡Te has equivocado! Memoriza la misma secuencia.");
    setError(true);

    // Reiniciar la selección del jugador pero mantener la misma secuencia
    setSelected([]);

    setShowSequence(true);
    setIsClickable(false); // Desactivar clics mientras se vuelve a mostrar la secuencia

    // Mostrar la secuencia por un corto período y luego ocultarla
    setTimeout(() => {
      setShowSequence(false);
      setMessage("Selecciona los cuadrados correctos.");
      setIsClickable(true); // Activar clics después de mostrar la secuencia
    }, displayTime * 1000);
  };

  return (
    <div className="memory-game">
      <h1>Juego de Memoria - Nivel {level}</h1>
      <p>{message}</p>

      {/* Mostrar la secuencia generada por el sistema */}
      <div>
        <h3>Secuencia a memorizar:</h3>
        <p>{sequence.join(", ")}</p>
      </div>

      {/* Mostrar los cuadrados seleccionados por el jugador */}
      <div>
        <h3>Cuadrados seleccionados por el jugador:</h3>
        <p>{selected.join(", ")}</p>
      </div>

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${SQUARE_SIZE}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${SQUARE_SIZE}px)`,
        }}
      >
        {Array.from({ length: gridSize }).map((_, row) =>
          Array.from({ length: gridSize }).map((_, col) => {
            const isActive = sequence.includes(`${row}-${col}`);
            const isSelected = selected.includes(`${row}-${col}`);

            return (
              <div
                key={`${row}-${col}`}
                className={`square ${
                  showSequence && isActive
                    ? "active" // Mostrar secuencia
                    : isSelected
                    ? "selected" // Mostrar selección del jugador
                    : ""
                }`}
                onClick={() => handleSquareClick(row, col)}
              ></div>
            );
          })
        )}
      </div>
      <button onClick={handleUserSelection}>Verificar Selección</button>
    </div>
  );
};

export default MemoryGame;