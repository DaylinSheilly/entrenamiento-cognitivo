import React, { useState, useEffect } from 'react';
import './SopaDeLetras.css';

const words = ["CASA", "PERRO", "SOL", "MAR"];
const gridSize = 10;

const WordSearch = () => {
  const [wordGrid, setWordGrid] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [wordsFound, setWordsFound] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [foundCoordinates, setFoundCoordinates] = useState([]);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const grid = generateEmptyGrid(gridSize);
    placeWordsInGrid(words, grid);
    fillEmptyCellsWithRandomLetters(grid);
    setWordGrid(grid);
    setCurrentSelection([]);
    setWordsFound([]);
    setIsDragging(false);
    setFoundCoordinates([]);
  };

  const generateEmptyGrid = (size) => {
    return Array(size).fill(null).map(() => Array(size).fill('_'));
  };

  const placeWordsInGrid = (words, grid) => {
    words.forEach(word => {
      let placed = false;
      while (!placed) {
        const row = Math.floor(Math.random() * gridSize);
        const col = Math.floor(Math.random() * (gridSize - word.length));
        if (canPlaceWordAt(word, grid, row, col)) {
          for (let i = 0; i < word.length; i++) {
            grid[row][col + i] = word[i];
          }
          placed = true;
        }
      }
    });
  };

  const canPlaceWordAt = (word, grid, row, col) => {
    for (let i = 0; i < word.length; i++) {
      if (grid[row][col + i] !== '_') return false;
    }
    return true;
  };

  const fillEmptyCellsWithRandomLetters = (grid) => {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === '_') {
          grid[row][col] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
      }
    }
  };

  const handleMouseDown = (rowIndex, colIndex) => {
    setIsDragging(true);
    setCurrentSelection([{ rowIndex, colIndex }]);
  };

  const handleMouseEnter = (rowIndex, colIndex) => {
    if (!isDragging) return;

    const newSelection = [...currentSelection, { rowIndex, colIndex }];
    setCurrentSelection(newSelection);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    const selectedWord = currentSelection.map(({ rowIndex, colIndex }) => wordGrid[rowIndex][colIndex]).join('');

    if (words.includes(selectedWord) && !wordsFound.includes(selectedWord)) {
      setWordsFound([...wordsFound, selectedWord]);
      setFoundCoordinates([...foundCoordinates, ...currentSelection]);

      if (wordsFound.length + 1 === words.length) {
        setTimeout(() => {
          alert('¡Has ganado!');
          startNewGame();
        }, 1000);
      }
    }

    setIsDragging(false);
    setCurrentSelection([]);
  };

  const isCellFound = (rowIndex, colIndex) => {
    return foundCoordinates.some(coord => coord.rowIndex === rowIndex && coord.colIndex === colIndex);
  };

  return (
    <div>
      <div
        id="wordSearchContainer"
        onMouseUp={handleMouseUp} // Detectar el final del arrastre
      >
        {wordGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`cell ${
                isCellFound(rowIndex, colIndex) ? 'found' : 
                currentSelection.some(selection => selection.rowIndex === rowIndex && selection.colIndex === colIndex) ? 'selected' : ''
              }`}
              onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)} // Seguir el arrastre
            >
              {cell}
            </div>
          ))
        )}
      </div>
      <div id="wordsList" className="wordsList">
        {words.map(word => (
          <div key={word} className={wordsFound.includes(word) ? 'found' : ''}>
            {word}
          </div>
        ))}
      </div>
      <button onClick={startNewGame}>Generar Nueva Sopa de Letras</button>
    </div>
  );
};

export default WordSearch;
