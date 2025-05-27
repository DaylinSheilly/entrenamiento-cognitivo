import React, { useState, useEffect, useCallback, useRef } from 'react';
import './SopaDeLetras.css';
import wordsData from './words-data.json';

const WordSearch = ({ onGameEnd }) => {
  const [level, setLevel] = useState(1);
  const [wordGrid, setWordGrid] = useState([]);
  const [words, setWords] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [wordsFound, setWordsFound] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [foundCoordinates, setFoundCoordinates] = useState([]);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [time, setTime] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finalErrors, setFinalErrors] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState(null);
  const [wordCoordinates, setWordCoordinates] = useState({});
  const [fullWordCoordinates, setFullWordCoordinates] = useState({});
  const [message, setMessage] = useState("");
  const [totalTime, setTotalTime] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const isHandlingGameEnd = useRef(false);

  // FUNCIONES DE REGISTRO DE ESTADISTICAS -------------------------------------------- //

  const gameData = {
    game_name: "Sopa de letras",
    level: level, // Usar el estado 'level' que ya existe (no currentLevel)
    difficulty: level <= 1 ? "fácil" :
      level <= 2 ? "medio" : "difícil",
    actions_taken: totalAnswers,
    accuracy: totalAnswers > 0 ?
      Number(((correctAnswers / totalAnswers) * 100).toFixed(2)) : 0,
    streaks: maxStreak,
    errors: finalErrors, // Usar los errores finales acumulados
    score: finalScore, // Usar el puntaje final acumulado
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

  const getLevelConfig = useCallback((level) => {
    switch (level) {
      case 1:
        return { gridSize: 7, wordCount: 10 };
      case 2:
        return { gridSize: 11, wordCount: 15 };
      case 3:
        return { gridSize: 12, wordCount: 18 };
      default:
        return { gridSize: 7, wordCount: 10 };
    }
  }, []);

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
    // 1. Resetear estados principales del juego
    setGameStarted(true);
    setGameOver(false);
    setCountdown(null);

    // 2. Reiniciar estadísticas y puntuaciones
    setLevel(1);
    setScore(0);
    setFinalScore(0);
    setErrors(0);
    setFinalErrors(0);
    setCorrectAnswers(0);
    setTotalAnswers(0);
    setTime(0);
    setTotalTime(0);
    setStartTime(Date.now());
    setLastErrorTime(null);

    // 3. Reiniciar estado del tablero y palabras
    setWordGrid([]);
    setWords([]);
    setWordsFound([]);
    setCurrentSelection([]);
    setFoundCoordinates([]);
    setWordCoordinates({});
    setFullWordCoordinates({});

    // 4. Resetear interacciones y mensajes
    setIsDragging(false);
    setMessage("");

    // 5. Limpiar timers y referencias
    isHandlingGameEnd.current = false;

    // 6. Iniciar nueva partida
    startNewGame();
  };

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

  const placeWordsInGrid = useCallback((words, gridSize, setWordCoordinates, setFullWordCoordinates, level) => {
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

        for (let attempt = 0; attempt < 2000; attempt++) {
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

            // Almacenar las coordenadas de todas las letras
            const wordCoordinates = [];
            for (let i = 0; i < word.length; i++) {
              const newRow = row + i * dy;
              const newCol = col + i * dx;

              console.log(`Placed word ${word} at coordinates:`, newRow, newCol);

              // Verificar que las coordenadas están dentro de los límites del grid
              if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                wordCoordinates.push([newRow, newCol]);
              } else {
                console.error(`Coordenada fuera de límites: (${newRow}, ${newCol})`);
                break; // Si alguna coordenada está fuera de los límites, detener el proceso
              }
            }

            if (wordCoordinates.length === word.length) {
              // Si todas las coordenadas son válidas, guardarlas en el diccionario
              setFullWordCoordinates((prevCoords) => ({
                ...prevCoords,
                [word]: wordCoordinates,
              }));
            }

            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        console.warn(`Could not place word: ${word}`);
      }
    }

    fillEmptyCells(grid, level); // Pasa el level aquí
    return { grid, placedWords };
  }, [level]); // Agregar level a las dependencias

  const fillEmptyCells = (grid, level) => {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === '_') {
          if (level == 3) {
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
    setFinalScore(prev => prev + score);
    setFinalErrors(prev => prev + errors);

    const { gridSize, wordCount } = getLevelConfig(level);
    const newWords = generateWords(wordCount, level);
    const { grid, placedWords } = placeWordsInGrid(newWords, gridSize, setWordCoordinates, setFullWordCoordinates, level);

    setWordGrid(grid);
    setWords(placedWords);
    setCurrentSelection([]);
    setWordsFound([]);
    setIsDragging(false);
    setFoundCoordinates([]);
    setTime(0);
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

  /**
 * Inicia la selección de celdas cuando el usuario hace clic en una celda.
 * 
 * @param {number} rowIndex - Índice de la fila de la celda seleccionada.
 * @param {number} colIndex - Índice de la columna de la celda seleccionada.
 */
  const handleMouseDown = useCallback((rowIndex, colIndex) => {
    setIsDragging(true);
    setCurrentSelection([{ rowIndex, colIndex }]);
  }, []);

  /**
   * Maneja la selección de celdas mientras el usuario arrastra el mouse.
   * Permite seleccionar palabras en horizontal, vertical o diagonal.
   * 
   * @param {number} rowIndex - Índice de la fila de la celda actual.
   * @param {number} colIndex - Índice de la columna de la celda actual.
   */
  const handleMouseEnter = useCallback((rowIndex, colIndex) => {
    if (!isDragging || currentSelection.length === 0) return;

    const startCell = currentSelection[0]; // Primera celda seleccionada
    const dx = colIndex - startCell.colIndex;
    const dy = rowIndex - startCell.rowIndex;

    let path = [];

    if (Math.abs(dx) > Math.abs(dy)) {
      // Movimiento horizontal
      const step = dx > 0 ? 1 : -1;
      for (let x = startCell.colIndex; x !== colIndex + step; x += step) {
        path.push({ rowIndex: startCell.rowIndex, colIndex: x });
      }
    } else if (Math.abs(dx) < Math.abs(dy)) {
      // Movimiento vertical
      const step = dy > 0 ? 1 : -1;
      for (let y = startCell.rowIndex; y !== rowIndex + step; y += step) {
        path.push({ rowIndex: y, colIndex: startCell.colIndex });
      }
    } else {
      // Movimiento diagonal
      const stepX = dx > 0 ? 1 : -1;
      const stepY = dy > 0 ? 1 : -1;
      let x = startCell.colIndex;
      let y = startCell.rowIndex;
      while (x !== colIndex + stepX && y !== rowIndex + stepY) {
        path.push({ rowIndex: y, colIndex: x });
        x += stepX;
        y += stepY;
      }
    }

    setCurrentSelection(path);
  }, [isDragging, currentSelection]);

  /**
   * Finaliza la selección de celdas cuando el usuario suelta el botón del mouse.
   * Valida la palabra seleccionada y actualiza el estado del juego.
   */
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setTotalAnswers((prev) => prev + 1);

    const selectedWord = getSelectedWord(currentSelection);
    const reversedWord = selectedWord.split('').reverse().join('');

    if (
      (words.includes(selectedWord) || words.includes(reversedWord)) &&
      !wordsFound.includes(selectedWord) &&
      !wordsFound.includes(reversedWord)
    ) {
      setCurrentStreak(prev => {
        const newStreak = prev + 1;
        setMaxStreak(prevMax => Math.max(prevMax, newStreak));
        return newStreak;
      });
      const foundWord = words.includes(selectedWord) ? selectedWord : reversedWord;

      setMessage(`¡Palabra ${foundWord} encontrada!`);
      setCorrectAnswers((prev) => prev + 1);
      setWordsFound(prev => [...prev, foundWord]);
      setFoundCoordinates(prev => [...prev, ...currentSelection]);
      setScore(prevScore => prevScore + foundWord.length);

      if (wordsFound.length + 1 === words.length) {
        setMessage(`¡Nivel ${level} completado!`);
        setTimeout(() => {
          resetGridStyles();
          if (level < 3) {
            setLevel(prevLevel => prevLevel + 1); // Deja que el useEffect maneje finalScore
          } else {
            setMessage("¡Felicidades! Has completado el juego.");
            setTotalTime(Date.now() - startTime);
            setGameOver(true);
          }
        }, 500);
      }
    } else {
      setCurrentStreak(0);
      setMessage(`Esa no es una palabra de la lista. ¡Intentalo de nuevo!`);
      setErrors(prevErrors => prevErrors + 1);
      setLastErrorTime(Date.now());
    }

    setIsDragging(false);
    setCurrentSelection([]);
  }, [isDragging, currentSelection, words, wordsFound, level]);

  const resetGridStyles = () => {
    const cells = document.querySelectorAll('.sopa-cell'); // Asegúrate de que la clase es correcta
    if (cells.length === 0) return; // Evitar ejecución innecesaria

    cells.forEach(cell => cell.classList.remove('found', 'selected', 'highlight')); // Remueve más clases si es necesario
  };

  const getSelectedWord = useCallback((selection) => {
    return selection.map(({ rowIndex, colIndex }) => wordGrid[rowIndex][colIndex]).join('');
  }, [wordGrid]);

  const isCellFound = useCallback((rowIndex, colIndex) => {
    return foundCoordinates.some(coord => coord.rowIndex === rowIndex && coord.colIndex === colIndex);
  }, [foundCoordinates]);

  const findWordCoordinate = useCallback((word) => {
    if (wordCoordinates[word]) {
      return wordCoordinates[word]; // Devuelve las coordenadas si la palabra existe en el diccionario
    } else {
      return null; // Devuelve null si la palabra no está almacenada
    }
  }, [wordGrid]);

  const giveHint = useCallback(() => {
    const unFoundWords = words.filter(word => !wordsFound.includes(word));
    if (unFoundWords.length > 0) {
      const randomWord = unFoundWords[Math.floor(Math.random() * unFoundWords.length)];
      const hintCoord = findWordCoordinate(randomWord);

      if (hintCoord) {
        const [row, col] = hintCoord;
        setErrors(prevErrors => prevErrors + 1);
        setScore(prevScore => prevScore - 1); // Resta puntos
        setTotalAnswers((prev) => prev + 1);

        // Selecciona la celda en el tablero
        const cellId = `${row}-${col}`;
        const cellElement = document.getElementById(cellId);

        if (cellElement) {
          // Añade la clase 'highlight' para aplicar el color
          cellElement.classList.add('highlight');

          // Remueve la clase 'highlight' después de 1.5 segundos (coincide con la transición)
          setTimeout(() => {
            cellElement.classList.remove('highlight');
          }, 1500);
        }
      } else {
        alert(`La palabra "${randomWord}" no está en el tablero.`);
      }
    }
  }, [words, wordsFound, findWordCoordinate]);

  const getWordCoordinates = useCallback((word) => {
    // Verificar si la palabra existe en el diccionario
    if (fullWordCoordinates[word]) {
      return fullWordCoordinates[word]; // Retorna las coordenadas de la palabra
    } else {
      console.warn(`La palabra "${word}" no se encuentra en el diccionario.`);
      return null; // Retorna null si la palabra no está en el diccionario
    }
  });

  const revealWord = useCallback(() => {
    const unFoundWords = words.filter(word => !wordsFound.includes(word));
    if (unFoundWords.length > 0) {
      const randomWord = unFoundWords[Math.floor(Math.random() * unFoundWords.length)];
      setWordsFound(prev => [...prev, randomWord]);

      // Obtiene las coordenadas de toda la palabra
      const wordCoords = getWordCoordinates(randomWord);
      console.log(wordCoords)

      if (wordCoords) {
        // Aplica la clase "found" a todas las coordenadas de la palabra
        setScore(prevScore => prevScore - randomWord.length); // Resta puntos
        setErrors(prevErrors => prevErrors + 1);
        setTotalAnswers((prev) => prev + 1);
        wordCoords.forEach(([row, col]) => {
          const cell = document.getElementById(`${row}-${col}`);  // Selecciona por id
          if (cell) {
            cell.classList.add('found');  // Aplica la clase CSS
          }
        });

        setFoundCoordinates(prev => [...prev, ...wordCoords]);
      }
    }
    if (wordsFound.length + 1 === words.length) {
      setTimeout(() => {
        alert(`¡Nivel ${level} completado!`);

        // Resetea el estilo de las celdas
        resetGridStyles();

        // Cambia al siguiente nivel
        setLevel(prevLevel => (prevLevel < 3 ? prevLevel + 1 : 1));
      }, 500);
    }
  }, [words, wordsFound, getWordCoordinates, fullWordCoordinates]);

  useEffect(() => {
    if (level > 1 || gameOver) {
      setFinalScore(prevFinalScore => prevFinalScore + score);
      setFinalErrors(prevTotalErrors => prevTotalErrors + errors);

      if (!gameOver) {
        setScore(0);
        setErrors(0);
      }
    }
  }, [level, gameOver]);

  return (
    <div className="sopa-game-container">
      {gameOver ? (
        <div className="sopa-fin-juego-container">
          <h1>Fin del juego</h1>
          <div className="sopa-stats-table-wrapper">
            <table className="sopa-stats-table">
              <thead>
                <tr>
                  <th>⏱️ Tiempo total</th>
                  <th>🎯 Puntaje final</th>
                  <th>🏆 Niveles completados</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{(totalTime / 1000).toFixed(2)} s</td>
                  <td>{finalScore}</td>
                  <td>{level}</td>
                </tr>
                <tr>
                  <td>✅ Correctas: {correctAnswers}</td>
                  <td>❌ Errores: {finalErrors}</td>
                  <td>
                    📊 Precisión: {totalAnswers > 0
                      ? ((correctAnswers / totalAnswers) * 100).toFixed(2)
                      : "0"}%
                  </td>
                </tr>
                <tr>
                  <td colSpan={3}>
                    🕒 Tiempo promedio por palabra: {correctAnswers > 0 ? `${(totalTime / correctAnswers / 1000).toFixed(2)} s` : "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button onClick={startCountdown}>
            Jugar de nuevo
          </button>
        </div>
      ) : !gameStarted ? (
        countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
          <div className="sopa-start-screen">
            <h2>¡Bienvenido a Sopa de letras!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="sopa-countdown">{countdown}</div>
        )
      ) : (
        <div className='sopa-app'>
          <>
            <div className="sopa-game-info">
              <section className="sopa-info-row">
                <div className="stat-item">
                  <strong>Puntaje:</strong> <span>{score}</span>
                </div>
                <div className="stat-item">
                  <strong>Errores:</strong> <span>{errors}</span>
                </div>
                <div className="stat-item">
                  <strong>Tiempo:</strong> <span>{time} s</span>
                </div>
              </section>
              <div className="stat-item">
                <strong>Nivel:</strong> <span>{level}</span>
              </div>
              {message && <p>{message}</p>}
            </div>
          </>
          <main className="sopa-main" style={{ "--level": level }}>
            <div
              id="sopa-grid"
              style={{ "--grid-cols": wordGrid[0]?.length, "--grid-rows": wordGrid.length }}
              onMouseUp={handleMouseUp}
            >
              {wordGrid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    id={`${rowIndex}-${colIndex}`}
                    key={`${rowIndex}-${colIndex}`}
                    className={`sopa-cell ${isCellFound(rowIndex, colIndex)
                      ? "found"
                      : currentSelection.some(
                        (selection) =>
                          selection.rowIndex === rowIndex &&
                          selection.colIndex === colIndex
                      )
                        ? "selected"
                        : ""
                      }`}
                    onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                    onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  >
                    {cell}
                  </div>
                ))
              )}
            </div>
            <div id="sopa-wordsList" className="sopa-words-list">
              {words.map(word => (
                <div key={word} className={wordsFound.includes(word) ? 'found' : ''}>
                  {word}
                </div>
              ))}
            </div>
            <div className="sopa-button-container">
              <button className="sopa-button hint-button-sopa" onClick={giveHint}>
                Dar Pista
              </button>
              <button className="sopa-button reveal-button-sopa" onClick={revealWord}>
                Revelar Palabra
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default WordSearch;