import React, { useState, useEffect } from 'react';
import { FaTrophy, FaExclamationTriangle, FaBrain } from 'react-icons/fa';
import './App.css';

const SQUARE_SIZE = 80;

function MemoryGame() {
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); // 'playing', 'won', 'lost'
  const [numSquares, setNumSquares] = useState(3); // Tamaño inicial de la cuadrícula
  const [gameGrid, setGameGrid] = useState([]);
  const [showingSequence, setShowingSequence] = useState(true);
  const [sequence, setSequence] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState('Memoriza el patrón...');

  // Inicializa el juego con un nuevo nivel
  useEffect(() => {
    generateGrid();
    generateSequence();
    setTimeout(() => setShowingSequence(false), 2000 * level); // Mostrar la secuencia
  }, [level]);

  // Generar la cuadrícula según el nivel
  const generateGrid = () => {
    const gridSize = level + 2; // Tamaño de la cuadrícula en función del nivel
    setNumSquares(gridSize);

    const newGrid = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(false)); // Inicializar todas las celdas en `false`
    setGameGrid(newGrid);
  };

  // Generar una secuencia aleatoria de posiciones en la cuadrícula
  const generateSequence = () => {
    const gridSize = level + 2;
    const newSequence = [];

    for (let i = 0; i < level + 2; i++) {
      const randomRow = Math.floor(Math.random() * gridSize);
      const randomCol = Math.floor(Math.random() * gridSize);
      newSequence.push([randomRow, randomCol]);
    }

    setSequence(newSequence);
    showSequence(newSequence);
  };

  // Mostrar la secuencia al usuario
  const showSequence = (sequence) => {
    let index = 0;
    const intervalId = setInterval(() => {
      if (index >= sequence.length) {
        clearInterval(intervalId);
        setShowingSequence(false);
        return;
      }

      const [row, col] = sequence[index];
      highlightSquare(row, col, 'green');

      setTimeout(() => {
        resetSquare(row, col);
        index++;
      }, 500);
    }, 1000);
  };

  // Resaltar un cuadrado específico
  const highlightSquare = (row, col, color) => {
    setGameGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[row][col] = color;
      return newGrid;
    });
  };

  // Resetear el color de un cuadrado específico
  const resetSquare = (row, col) => {
    setGameGrid((prevGrid) => {
      const newGrid = [...prevGrid];
      newGrid[row][col] = false;
      return newGrid;
    });
  };

  // Manejar los clics del usuario en la cuadrícula
  const handleSquareClick = (row, col) => {
    if (sequence[currentStep][0] === row && sequence[currentStep][1] === col) {
      // Clic correcto
      highlightSquare(row, col, 'green');
      setCurrentStep((prevStep) => prevStep + 1);
      setScore((prevScore) => prevScore + 10);

      if (currentStep + 1 === sequence.length) {
        // Si es el último paso de la secuencia, ganar
        setGameStatus('won');
        setMessage('¡Ganaste! Avanza al siguiente nivel.');
      }
    } else {
      // Clic incorrecto
      highlightSquare(row, col, 'red');
      setGameStatus('lost');
      setMessage('¡Perdiste! Inténtalo de nuevo.');
    }
  };

  // Reiniciar el juego para avanzar al siguiente nivel
  const playAgain = () => {
    setGameStatus('playing');
    setScore(0);
    setCurrentStep(0);
    setMessage('Memoriza el patrón...');
    setLevel(1);
    generateGrid();
    generateSequence();
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="title">
            {gameStatus === 'won' ? (
              <FaTrophy className="w-6 h-6 text-green-500" />
            ) : gameStatus === 'lost' ? (
              <FaExclamationTriangle className="w-6 h-6 text-red-500" />
            ) : (
              <FaBrain className="w-6 h-6 text-indigo-500" />
            )}
            <h1 className="card-title">Memory Game</h1>
          </div>
          <div className="flex">
            <div className="level">Level {level}</div>
            <div className="score">Score: {score}</div>
          </div>
        </div>

        <div className="relative">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${numSquares}, ${SQUARE_SIZE}px)`,
              gridTemplateRows: `repeat(${numSquares}, ${SQUARE_SIZE}px)`,
            }}
          >
            {gameGrid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`square ${
                    cell === true
                      ? 'bg-indigo-500'
                      : cell === 'green'
                      ? 'bg-green-500'
                      : cell === 'red'
                      ? 'bg-red-500'
                      : 'bg-gray-700'
                  }`}
                  style={{
                    width: SQUARE_SIZE,
                    height: SQUARE_SIZE,
                    transform: showingSequence ? 'scale(1.05)' : 'scale(1)',
                  }}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                  disabled={showingSequence || gameStatus !== 'playing'}
                />
              ))
            )}
          </div>
        </div>

        <div className={`alert ${gameStatus === 'lost' ? 'alert-destructive' : 'alert-default'}`}>
          <p>{message}</p>
        </div>

        {gameStatus === 'won' && (
          <div className="text-center">
            <button className="button-play-again" onClick={playAgain}>
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="instructions">¡Memoriza el patrón y reproduce la secuencia correctamente!</div>
    </div>
  );
}

export default MemoryGame;
