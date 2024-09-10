import React, { useState, useEffect, useCallback } from 'react';
import './SopaDeLetras.css';
import wordsData from './words-data.json';

const WordSearch = () => {
  const [level, setLevel] = useState(1);
  const [wordGrid, setWordGrid] = useState([]);
  const [words, setWords] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [wordsFound, setWordsFound] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [foundCoordinates, setFoundCoordinates] = useState([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(null);
  const [wordCoordinates, setWordCoordinates] = useState({});

  const getLevelConfig = useCallback((level) => {
    switch(level) {
      case 1:
        return { gridSize: 7, wordCount: 10 };
      case 2:
        return { gridSize: 11, wordCount: 15 };
      case 3:
        return { gridSize: 14, wordCount: 20 };
      default:
        return { gridSize: 7, wordCount: 10 };
    }
  }, []);

  // Función para obtener palabras aleatorias
  const getRandomWords = (words, count) => {
    const shuffled = words.sort(() => 0.5 - Math.random()); // Mezcla las palabras
    return shuffled.slice(0, count); // Toma la cantidad requerida
  };

  const generateWords = useCallback((count, nivel) => {
    // Obtener las palabras del nivel especificado
    const palabrasNivel = wordsData.niveles.find(n => n.nivel === nivel).palabras;
    
    // Seleccionar aleatoriamente 'count' palabras de ese nivel
    return getRandomWords(palabrasNivel, count);
  }, []);

  const generateEmptyGrid = useCallback((size) => {
    return Array(size).fill(null).map(() => Array(size).fill('_'));
  }, []);

  const canPlaceWord = (word, grid, row, col, dx, dy) => {
    const gridSize = grid.length;
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dy;
      const newCol = col + i * dx;
      if (
        newRow < 0 || newRow >= gridSize ||
        newCol < 0 || newCol >= gridSize ||
        (grid[newRow][newCol] !== '_' && grid[newRow][newCol] !== word[i])
      ) {
        return false;
      }
    }
    return true;
  };

  const placeWord = (word, grid, row, col, dx, dy) => {
    for (let i = 0; i < word.length; i++) {
      grid[row + i * dy][col + i * dx] = word[i];
    }
  };

  const directions = [
    [0, 1], [1, 0], [1, 1], [-1, 1] // horizontal, vertical, diagonal down, diagonal up
  ];

  const placeWordsInGrid = useCallback((words, gridSize, setWordCoordinates) => {
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill('_'));
    const placedWords = [];
  
    const directions = [
      [0, 1], [1, 0], [1, 1], [-1, 1], // horizontal, vertical, diagonal down, diagonal up
      [0, -1], [-1, 0], [-1, -1], [1, -1] // reverse directions
    ];
  
    const shuffledWords = words.sort(() => Math.random() - 0.5);
  
    for (const word of shuffledWords) {
      let placed = false;
      const shuffledDirections = directions.sort(() => Math.random() - 0.5);
  
      for (const [dx, dy] of shuffledDirections) {
        if (placed) break;
  
        for (let attempt = 0; attempt < 1000; attempt++) {
          const row = Math.floor(Math.random() * gridSize);
          const col = Math.floor(Math.random() * gridSize);
  
          if (canPlaceWord(word, grid, row, col, dx, dy)) {
            placeWord(word, grid, row, col, dx, dy);
            placedWords.push(word);
  
            // Almacenar las coordenadas de la primera letra
            setWordCoordinates((prevCoords) => ({
              ...prevCoords,
              [word]: [row, col],
            }));
  
            placed = true;
            break;
          }
        }
      }
  
      if (!placed) {
        console.warn(`Could not place word: ${word}`);
      }
    }
  
    fillEmptyCells(grid);
    return { grid, placedWords };
  }, []);  

  const fillEmptyCells = (grid, level) => {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === '_') {
          if (level === 3) {
            // Llenar con números del 0 al 9 en el nivel 3
            grid[row][col] = Math.floor(Math.random() * 10).toString();
          } else {
            // Llenar con letras mayúsculas (A-Z) en niveles 1 y 2
            grid[row][col] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
          }
        }
      }
    }
  };
  

  const startNewGame = useCallback(() => {
    const { gridSize, wordCount } = getLevelConfig(level);
    const newWords = generateWords(wordCount, level);
    const { grid, placedWords } = placeWordsInGrid(newWords, gridSize, setWordCoordinates);
    
    setWordGrid(grid);
    setWords(placedWords);
    setCurrentSelection([]);
    setWordsFound([]);
    setIsDragging(false);
    setFoundCoordinates([]);
    setScore(0);
    setTime(0);
    setErrors(0);
    setLastErrorTime(null);
  }, [level, getLevelConfig, generateWords, placeWordsInGrid]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prevTime => prevTime + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMouseDown = useCallback((rowIndex, colIndex) => {
    setIsDragging(true);
    setCurrentSelection([{ rowIndex, colIndex }]);
  }, []);

  const handleMouseEnter = useCallback((rowIndex, colIndex) => {
    if (!isDragging) return;
    setCurrentSelection(prev => [...prev, { rowIndex, colIndex }]);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    const selectedWord = getSelectedWord(currentSelection);

    if (words.includes(selectedWord) && !wordsFound.includes(selectedWord)) {
      setWordsFound(prev => [...prev, selectedWord]);
      setFoundCoordinates(prev => [...prev, ...currentSelection]);
      setScore(prevScore => prevScore + selectedWord.length);

      if (wordsFound.length + 1 === words.length) {
        setTimeout(() => {
          alert(`¡Nivel ${level} completado!`);
          setLevel(prevLevel => (prevLevel < 3 ? prevLevel + 1 : 1));
        }, 1000);
      }
    } else {
      setErrors(prevErrors => prevErrors + 1);
      setLastErrorTime(Date.now());
    }

    setIsDragging(false);
    setCurrentSelection([]);
  }, [isDragging, currentSelection, words, wordsFound, level]);

  const getSelectedWord = useCallback((selection) => {
    return selection.map(({ rowIndex, colIndex }) => wordGrid[rowIndex][colIndex]).join('');
  }, [wordGrid]);

  const isCellFound = useCallback((rowIndex, colIndex) => {
    return foundCoordinates.some(coord => coord.rowIndex === rowIndex && coord.colIndex === colIndex);
  }, [foundCoordinates]);

  const giveHint = useCallback(() => {
    const unFoundWords = words.filter(word => !wordsFound.includes(word));
    if (unFoundWords.length > 0) {
      const randomWord = unFoundWords[Math.floor(Math.random() * unFoundWords.length)];
      const hintCoord = findWordCoordinate(randomWord);
      if (hintCoord) {
        const [row, col] = hintCoord; // Desestructurar el array de coordenadas
        alert(`Pista: La palabra "${randomWord}" comienza en la fila ${row + 1}, columna ${col + 1}`);
      }
      else{alert(`mejora esto sexo "${randomWord}"`);}
    }
  }, [words, wordsFound]);

  const findWordCoordinate = useCallback((word) => {
    if (wordCoordinates[word]) {
      return wordCoordinates[word]; // Devuelve las coordenadas si la palabra existe en el diccionario
    } else {
      return null; // Devuelve null si la palabra no está almacenada
    }
  }, [wordGrid]);

  const checkDirection = useCallback((word, row, col, rowDir, colDir) => {
    for (let i = 0; i < word.length; i++) {
      if (row < 0 || row >= wordGrid.length || col < 0 || col >= wordGrid[row].length || wordGrid[row][col] !== word[i]) {
        return false;
      }
      row += rowDir;
      col += colDir;
    }
    return true;
  }, [wordGrid]);

  const findWordCoordinates = useCallback((word) => {
    const coords = [];
    const startCoord = findWordCoordinate(word);
    if (startCoord) {
      let { row, col } = startCoord;
      const direction = checkDirection(word, row, col, 0, 1) ? { rowDir: 0, colDir: 1 } :
                        checkDirection(word, row, col, 1, 0) ? { rowDir: 1, colDir: 0 } :
                        checkDirection(word, row, col, 1, 1) ? { rowDir: 1, colDir: 1 } :
                        { rowDir: -1, colDir: 1 };
      for (let i = 0; i < word.length; i++) {
        coords.push({ rowIndex: row, colIndex: col });
        row += direction.rowDir;
        col += direction.colDir;
      }
    }
    return coords;
  }, [findWordCoordinate, checkDirection]);

  const revealWord = useCallback(() => {
    const unFoundWords = words.filter(word => !wordsFound.includes(word));
    if (unFoundWords.length > 0) {
      const randomWord = unFoundWords[Math.floor(Math.random() * unFoundWords.length)];
      setWordsFound(prev => [...prev, randomWord]);
      const wordCoords = findWordCoordinates(randomWord);
      setFoundCoordinates(prev => [...prev, ...wordCoords]);
      setScore(prevScore => prevScore - randomWord.length); // Resta puntos
    }
  }, [words, wordsFound, findWordCoordinates]);

  return (
    <div className={`game-container level-${level}`}>
      <h1>Sopa de Letras - Nivel {level}</h1>
      <div className="game-info">
        <div>Puntuación: {score}</div>
        <div>Errores: {errors}</div>
      </div>
      <div className="game-info">
        <div>Tiempo: {time} segundos</div>
      </div>
      <div id="wordSearchContainer" onMouseUp={handleMouseUp}>
        {wordGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`cell ${
                isCellFound(rowIndex, colIndex) ? 'found' : 
                currentSelection.some(selection => selection.rowIndex === rowIndex && selection.colIndex === colIndex) ? 'selected' : ''
              }`}
              onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
              onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
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
      <div className="button-container">
        <button className="hint-button" onClick={giveHint}>Dar Pista</button>
        <button className="reveal-button" onClick={revealWord}>Revelar Palabra</button>
        <button className="new-game-button" onClick={startNewGame}>Nueva Partida</button>
      </div>
    </div>
  );
};

export default React.memo(WordSearch);