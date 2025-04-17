import React, { useState, useEffect, useCallback, useRef } from 'react';
import './colorea-el-camino.css';

const ColoreaElCamino = () => {
  // Estado global: tiempo de inicio del juego (no se reinicia)
  const [countdown, setCountdown] = useState(null);
  const [totalTime, setTotalTime] = useState(0);

  // Estado para el nivel actual 
  const [nivel, setNivel] = useState(10);
  const hasAdvanced = useRef(false);
  const [message, setMessage] = useState("");

  // Estados de rendimiento global
  const [resolutionTime, setResolutionTime] = useState(null);
  const [totalErrors, setTotalErrors] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentLevelTime, setCurrentLevelTime] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);

  // Estados para medir tiempo de recuperación (se mide solo si el nivel se reinicia por error)
  const [recoveryStart, setRecoveryStart] = useState(null);
  const [recoveryTimes, setRecoveryTimes] = useState([]);

  // Estados para la propagación
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(null);
  // Tiempo de inicio de cada nivel (se reinicia al cambiar de nivel)
  const [startTime, setStartTime] = useState(Date.now());

  const errorTimeRef = useRef(null);

  // FUNCIONES DE LÓGICA DEL JUEGO -------------------------------------------- //

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

  // Función para inicializar el nivel
  const initializeLevel = useCallback((level) => {
    let rows = 5, cols = 5;
    let obstaclesProbability = 0;
    let activeBlocks = [];
    let grid;

    if (level === 1) {
      obstaclesProbability = 0;
      activeBlocks = [
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2), id: 1, color: "blue", headColor: "lightblue" }
      ];
      grid = Array.from({ length: rows }, () => Array(cols).fill(0));
      grid[Math.floor(rows / 2)][Math.floor(cols / 2)] = 1;
      return { grid, activeBlocks, numRows: rows, numCols: cols };

    } else if (level === 2) {
      let rows = 6, cols = 7;
      obstaclesProbability = 0;
      activeBlocks = [
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2) - 1, id: 1, color: "blue", headColor: "lightblue" },
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2) + 1, id: 2, color: "green", headColor: "lightgreen" }
      ];
      grid = Array.from({ length: rows }, () => Array(cols).fill(0));
      grid[Math.floor(rows / 2)][Math.floor(cols / 2) - 1] = 1;
      grid[Math.floor(rows / 2)][Math.floor(cols / 2) + 1] = 2;
      return { grid, activeBlocks, numRows: rows, numCols: cols };

    } else if (level === 3) {
      cols = 8;
      rows = 10;
      obstaclesProbability = 0;
      const staticGridLevel3 = [
        [0, 0, -1, 0, 0, 0, 0, -1],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, -1, 0, 0, 0, 0, -1],
        [0, 0, 0, 0, -1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, -1, 0, 0, 0, 0, 0, -1],
        [0, 0, 0, -1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, -1, 0, 0]
      ];
      activeBlocks = [
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2), id: 1, color: "blue", headColor: "lightblue" }
      ];
      grid = staticGridLevel3.map(r => r.slice());
      grid[activeBlocks[0].row][activeBlocks[0].col] = activeBlocks[0].id;
      return { grid, activeBlocks, numRows: rows, numCols: cols };

    } else {
      // Niveles 4 en adelante: generación dinámica optimizada del mapa

      // Elegir tamaño del mapa aleatoriamente entre 7x7 y 9x9
      cols = Math.floor(Math.random() * 3) + 7;
      rows = Math.floor(Math.random() * 3) + 7;

      // Probabilidad de obstáculos aumenta con el nivel (hasta un límite del 40%)
      let obstaclesProbability = Math.min(0.05 + (level - 4) * 0.05, 0.50);

      // Número de cabezas aumenta con el nivel (máximo 4)
      let numHeads = Math.min(2 + Math.floor(level / 5), 4);

      // Crear grid vacío (sin obstáculos)
      let tempGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
      let tempActiveBlocks = [];

      // Definir área segura para colocar las cabezas (evitar bordes)
      const safeRowRange = { min: 1, max: rows - 2 };
      const safeColRange = { min: 1, max: cols - 2 };


      // Colocar las cabezas en posiciones aleatorias dentro del área segura
      for (let i = 0; i < numHeads; i++) {
        let r, c;
        do {
          r = Math.floor(Math.random() * (safeRowRange.max - safeRowRange.min + 1)) + safeRowRange.min;
          c = Math.floor(Math.random() * (safeColRange.max - safeColRange.min + 1)) + safeColRange.min;
        } while (tempGrid[r][c] !== 0);

        let colors = ["blue", "green", "red", "yellow"];
        let headColors = ["lightblue", "lightgreen", "salmon", "orange"];
        tempActiveBlocks.push({ row: r, col: c, id: i + 1, color: colors[i], headColor: headColors[i] });
        tempGrid[r][c] = i + 1; // Marca la posición de la cabeza
      }
      // Función para conectar dos puntos con un camino Manhattan
      function connectPoints(p1, p2) {
        let curRow = p1.row;
        let curCol = p1.col;
        // Conectar verticalmente
        while (curRow !== p2.row) {
          curRow += (curRow < p2.row ? 1 : -1);
          if (tempGrid[curRow][curCol] === 0) {
            tempGrid[curRow][curCol] = 1; // 1 indica backbone (reserva de conectividad)
          }
        }
        // Conectar horizontalmente
        while (curCol !== p2.col) {
          curCol += (curCol < p2.col ? 1 : -1);
          if (tempGrid[curRow][curCol] === 0) {
            tempGrid[curRow][curCol] = 1;
          }
        }
      }

      // Conectar todas las cabezas en orden (asegurando un backbone)
      for (let i = 0; i < tempActiveBlocks.length - 1; i++) {
        connectPoints(tempActiveBlocks[i], tempActiveBlocks[i + 1]);
      }

      // Marcar zonas de seguridad alrededor de cada cabeza (para evitar obstáculos en sus inmediaciones)
      tempActiveBlocks.forEach(block => {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = block.row + dr;
            const c = block.col + dc;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
              if (tempGrid[r][c] === 0) {
                tempGrid[r][c] = 2; // 2 indica zona de seguridad
              }
            }
          }
        }
      });

      // Ahora, en las celdas que aún son 0 (no forman parte del backbone ni de zonas de seguridad), colocamos obstáculos aleatorios
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (tempGrid[r][c] === 0 && Math.random() < obstaclesProbability) {
            tempGrid[r][c] = -1; // -1 representa un obstáculo
          }
        }
      }

      // Restaurar las celdas de backbone (1) y zonas de seguridad (2) a 0, para que se consideren libres en la validación
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (tempGrid[r][c] === 1 || tempGrid[r][c] === 2) {
            tempGrid[r][c] = 0;
          }
        }
      }

      // Verificar si hay al menos un obstáculo
      let hasObstacle = tempGrid.some(row => row.includes(-1));

      if (!hasObstacle) {
        let emptyCells = [];

        // Buscar todas las celdas vacías (0) donde podríamos colocar un obstáculo
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (tempGrid[r][c] === 0) {
              emptyCells.push({ row: r, col: c });
            }
          }
        }

        // Intentar agregar un obstáculo sin romper la solución
        let placedObstacle = false;

        while (emptyCells.length > 0 && !placedObstacle) {
          let randomIndex = Math.floor(Math.random() * emptyCells.length);
          let { row, col } = emptyCells[randomIndex];

          tempGrid[row][col] = -1; // Colocar obstáculo temporalmente

          // Verificar si el mapa sigue siendo solucionable
          if (solveAndPrintMap(tempGrid, tempActiveBlocks)) {
            placedObstacle = true; // Se encontró una posición válida
          } else {
            tempGrid[row][col] = 0; // Revertir si el mapa no es solucionable
            emptyCells.splice(randomIndex, 1); // Eliminar esta celda de la lista e intentar otra
          }
        }
      }

      // Asegurarse de que las cabezas conserven su id
      tempActiveBlocks.forEach(block => {
        tempGrid[block.row][block.col] = block.id;
      });

      // Verificar que el mapa sea solucionable (BFS)
      if (!solveAndPrintMap(tempGrid, tempActiveBlocks)) {
        return initializeLevel(level); // Si no es soluble, se regenera
      }

      return { grid: tempGrid, activeBlocks: tempActiveBlocks, numRows: rows, numCols: cols };
    }
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setMessage("");
    setTotalErrors(0);
    setGameOver(false);
    setNivel(1); // Restablece el nivel inicial
    setResolutionTime(null);
    setIsResetting(false);
    setCurrentLevelTime(0);
    setRecoveryStart(null);
    setRecoveryTimes([]);
    setIsDrawing(false);
    setCurrentBlockIndex(null);
    setStartTime(Date.now()); // Reinicia el tiempo de inicio del nivel

    initializeLevel(1);
  };

  // Configuración inicial del nivel
  const [initialLevelConfig, setInitialLevelConfig] = useState(() => initializeLevel(1));
  // Configuración actual del nivel
  const [levelConfig, setLevelConfig] = useState(initialLevelConfig);
  const { grid, activeBlocks, numRows, numCols } = levelConfig;

  // Función de validación de mapa (BFS, solo 4 direcciones)
  function solveAndPrintMap(grid, activeBlocks) {
    const numRows = grid.length;
    const numCols = grid[0].length;

    // Matriz para marcar celdas visitadas y construir el mapa solucionado
    const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));
    const solvedMap = grid.map(row => row.slice());

    // Inicializamos la cola con todas las cabezas activas, cada una con su camino (path)
    const queue = [];
    activeBlocks.forEach(block => {
      queue.push({
        row: block.row,
        col: block.col,
        id: block.id,
        path: [{ row: block.row, col: block.col }]
      });
      visited[block.row][block.col] = true;
    });

    // Objeto para almacenar el camino continuo (la cadena) de cada cabeza
    const paths = {};
    activeBlocks.forEach(block => {
      paths[block.id] = [{ row: block.row, col: block.col }];
    });

    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 }
    ];

    // Usamos un índice en lugar de shift() para eficiencia
    let index = 0;
    while (index < queue.length) {
      const { row, col, id, path } = queue[index++];
      // Marcamos la celda en el mapa solucionado con el id correspondiente
      solvedMap[row][col] = id;
      // Actualizamos el camino para esta cabeza (si el camino actual es más largo)
      if (path.length > paths[id].length) {
        paths[id] = path;
      }
      // Expansión: solo encolamos la primera casilla adyacente válida para mantener un camino continuo
      for (const d of directions) {
        const newRow = row + d.row;
        const newCol = col + d.col;
        // Se valida: dentro de límites, la celda es blanca (0) y no ha sido visitada
        if (
          newRow >= 0 &&
          newRow < numRows &&
          newCol >= 0 &&
          newCol < numCols &&
          grid[newRow][newCol] === 0 && // Solo se expande sobre casillas blancas
          !visited[newRow][newCol]
        ) {
          visited[newRow][newCol] = true;
          // Creamos una nueva cadena copiando el camino actual y añadiendo la nueva celda
          const newPath = path.concat([{ row: newRow, col: newCol }]);
          queue.push({ row: newRow, col: newCol, id, path: newPath });
          // Rompemos para que solo se tome la primera dirección válida
          break;
        }
      }
    }

    // Verificamos que todas las celdas blancas hayan sido visitadas
    let allReachable = true;
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (grid[i][j] === 0 && !visited[i][j]) {
          allReachable = false;
          //console.warn(`La celda (${i}, ${j}) no es alcanzable.`);
        }
      }
    }

    if (allReachable) {
      //console.log("solveAndPrintMap: El mapa es solucionable. Mapa solucionado:");
      /*for (let i = 0; i < numRows; i++) {
        let line = "";
        for (let j = 0; j < numCols; j++) {
          if (grid[i][j] === -1) {
            line += " X ";
          } else {
            line += ` ${solvedMap[i][j]} `;
          }
        }
        console.log(line);
      }*/
      // Imprimimos los recorridos continuos de cada cabeza para depuración
      /*console.log("Recorridos continuos de las cabezas (cada movimiento es adyacente al anterior):");
      Object.keys(paths).forEach(id => {
        console.log(`Cabeza ${id}:`, paths[id]); 
      });*/
    } else {
      //console.error("solveAndPrintMap: El mapa NO es solucionable.");
    }

    return allReachable;
  }

  // Reinicia el nivel usando la configuración inicial.
  const resetBoard = useCallback((button) => {
    setTotalAnswers((prev) => prev + 1);
    setTotalErrors(prev => prev + 1);
    errorTimeRef.current = Date.now();
    if (button) {
      setMessage("");
    }
    setLevelConfig(initialLevelConfig);
    setIsDrawing(false);
    setCurrentBlockIndex(null);
  }, [initialLevelConfig]);

  // Al completar el nivel, se registra el tiempo y se pasa al siguiente nivel.
  const nextLevel = useCallback(() => {
    const levelTime = Date.now() - startTime;
    setResolutionTime(levelTime);

    // Si hubo un error previo, calcular el tiempo de recuperación
    if (errorTimeRef.current) {
      const recoveryTime = Date.now() - errorTimeRef.current;
      setRecoveryTimes(prev => [...prev, recoveryTime]);
      errorTimeRef.current = null; // Reiniciar para la siguiente ronda
    }

    if (nivel >= 10) {
      setTotalTime(Date.now() - startTime);
      setGameOver(true);
    } else {
      setTimeout(() => {
        setNivel(prev => prev + 1);
        const newConfig = initializeLevel(nivel + 1);
        setInitialLevelConfig(newConfig);
        setLevelConfig(newConfig);
        setIsDrawing(false);
        setCurrentBlockIndex(null);
        setStartTime(Date.now());
        setResolutionTime(null);
        setRecoveryStart(null);  // Esto se mantiene null para evitar mediciones erróneas
      }, 500);
    }
  }, [nivel, startTime]);

  // Verifica si dos celdas son adyacentes (solo horizontales o verticales).
  const isAdjacent = (cell1, cell2) => {
    return Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col) === 1;
  };

  // Devuelve las celdas adyacentes disponibles (valor 0) para un bloque.
  const getAvailableMoves = useCallback((block) => {
    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 }
    ];
    return directions.filter(dir => {
      const newRow = block.row + dir.row;
      const newCol = block.col + dir.col;
      if (newRow < 0 || newRow >= numRows || newCol < 0 || newCol >= numCols)
        return false;
      return levelConfig.grid[newRow][newCol] === 0;
    });
  }, [numRows, numCols, levelConfig.grid]);

  const isValidStart = (row, col) => {
    // Verifica si la celda pertenece a un bloque activo
    return activeBlocks.some(block => block.row === row && block.col === col);
  };

  // Inicio de la propagación: al hacer clic/tocar sobre una celda con un bloque activo.
  const handleMouseDown = (row, col) => {
    if (!isValidStart(row, col)) return; // Bloquea el inicio en celdas prohibidas
    const index = activeBlocks.findIndex(block => block.row === row && block.col === col);
    if (index === -1) return; // Solo activa si es un bloque válido

    setIsDrawing(true);
    setCurrentBlockIndex(index);
  };

  // Al mover el mouse sobre una celda, se valida la expansión del bloque activo.
  const handleMouseEnter = (row, col) => {
    if (!isDrawing || currentBlockIndex === null) return;
    if (levelConfig.grid[row][col] !== 0) return;

    const currentBlock = activeBlocks[currentBlockIndex];
    if (!isAdjacent(currentBlock, { row, col })) return;

    setLevelConfig(prev => {
      const newGrid = prev.grid.map(r => r.slice());
      newGrid[row][col] = currentBlock.id;

      const newActiveBlocks = prev.activeBlocks.slice();
      newActiveBlocks[currentBlockIndex] = { ...currentBlock, row, col };

      return { ...prev, grid: newGrid, activeBlocks: newActiveBlocks };
    });
  };

  // Detiene la propagación al soltar el mouse.
  const handleMouseUp = () => {
    setIsDrawing(false);
    setCurrentBlockIndex(null);
  };

  // Eventos táctiles
  const handleTouchStart = (row, col) => {
    const index = activeBlocks.findIndex(block => block.row === row && block.col === col);
    if (index === -1) return;

    setIsDrawing(true);
    setCurrentBlockIndex(index);
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Evita desplazamientos inesperados en dispositivos táctiles
    if (!isDrawing) return;

    const touch = e.touches[0];
    if (!touch) return;

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element || !element.dataset.row || !element.dataset.col) return;

    const row = parseInt(element.dataset.row, 10);
    const col = parseInt(element.dataset.col, 10);
    handleMouseEnter(row, col);
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    setCurrentBlockIndex(null);
  };

  const calculateRecoveryTime = () => {
    if (recoveryTimes.length === 0) return "0.00";

    const avgRecoveryTimeSeconds =
      recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length / 1000;

    return avgRecoveryTimeSeconds.toFixed(2);
  };

  // EFECTOS DE REACT -------------------------------------------------------- //

  // Cada vez que cambia el nivel, se actualiza la configuración inicial.
  useEffect(() => {
    const newConfig = initializeLevel(nivel);
    setInitialLevelConfig(newConfig);
    setLevelConfig(newConfig);
    setStartTime(Date.now());
    setResolutionTime(null);
    setRecoveryTimes([]);
    setRecoveryStart(null);
  }, [nivel, initializeLevel]);

  useEffect(() => {
    const gridFull = levelConfig.grid.every(row => row.every(cell => cell !== 0));

    if (gridFull && !hasAdvanced.current) {
      hasAdvanced.current = true;

      // Si hubo un error antes de completar el nivel, registramos el tiempo de recuperación
      if (errorTimeRef.current) {
        const recoveryTime = Date.now() - errorTimeRef.current;
        setRecoveryTimes((prev) => [...prev, recoveryTime]); // Guardamos el tiempo de recuperación
        errorTimeRef.current = null; // Reiniciar el tiempo de error
      }

      setTotalAnswers((prev) => prev + 1);
      setCorrectAnswers((prev) => prev + 1);
      setMessage("¡Excelente trabajo! Has completado el nivel con éxito.");
      nextLevel();

      setTimeout(() => {
        hasAdvanced.current = false;
      }, 100);
    }
  }, [levelConfig.grid, nextLevel]);

  useEffect(() => {
    const gridFull = levelConfig.grid.every(row => row.every(cell => cell !== 0));
    if (gridFull || isResetting) return;

    const allBlocked = activeBlocks.every(block => getAvailableMoves(block).length === 0);

    if (allBlocked) {
      setMessage("¡Ups! Te queadaste sin movimientos. Por favor, inténtalo de nuevo.");

      // Si ya había registrado un tiempo de error, significa que se volvió a equivocar. Descartamos el tiempo anterior.
      errorTimeRef.current = Date.now();

      setIsResetting(true);
      setTimeout(() => {
        resetBoard(false);
        setIsResetting(false);
      }, 500);
    }
  }, [levelConfig.grid, activeBlocks, recoveryStart, getAvailableMoves, resetBoard, isResetting]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDrawing(false);
      setCurrentBlockIndex(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Actualiza el tiempo actual del nivel en tiempo real (en milisegundos).
  useEffect(() => {
    if (!gameOver && resolutionTime === null) {
      const interval = setInterval(() => {
        setCurrentLevelTime(Date.now() - startTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, gameOver, resolutionTime]);

  const cellSize = 45;
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${numCols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${numRows}, ${cellSize}px)`,
    gap: '2px',
    margin: '20px auto',
    width: `${numCols * (cellSize + 2)}px`
  };

  return (
    <div className="colores-game-container">
      {gameOver ? (
        <div className="colores-fin-juego-container">
          <h1>Fin del juego</h1>
          <p>🕒 Tiempo total de juego: {(totalTime / 1000).toFixed(2)} segundos</p>
          <p>✅ Correctas: {correctAnswers} de {totalAnswers}</p>
          <p>❌ Errores: {totalErrors}</p>
          <p>📊 Precisión: {totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : "0"}%</p>
          <p>🕒 Tiempo de recuperación: {calculateRecoveryTime()}</p>
          <button onClick={startCountdown}>
            Jugar de nuevo
          </button>
        </div>
      ) : !gameStarted ? (
        countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
          <div className="colores-start-screen">
            <h2>¡Bienvenido a Colorea el camino!</h2>
            <button onClick={startCountdown}>Comenzar Juego</button>
          </div>
        ) : (
          <div className="colores-countdown">{countdown}</div>
        )
      ) : (
        <div className="colores-app">
          <div className="colores-grid-container">
            <>
              <div className="colores-game-info">
                <div className="colores-game-stats">
                  <p>Nivel: {nivel}</p>
                  <p>Errores: {totalErrors}</p>
                  <p>Tiempo de resolución: {currentLevelTime ? Math.round(currentLevelTime / 1000) + " s" : "0" + " s"}</p>
                </div>
                {message && <p>{message}</p>}

              </div>
            </>
            <div
              className="colores-grid"
              style={gridStyle}
              onMouseDown={(e) => e.preventDefault()}
              onMouseLeave={() => setIsDrawing(false)}
              onMouseUp={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  let backgroundColor = "white";
                  if (cell === -1) {
                    backgroundColor = "#7f8c8d";
                  } else if (cell !== 0) {
                    const block = activeBlocks.find(b => b.id === cell);
                    if (block) {
                      backgroundColor = (block.row === rowIndex && block.col === colIndex)
                        ? block.headColor
                        : block.color;
                    }
                  }
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="colores-celda"
                      data-row={rowIndex}
                      data-col={colIndex}
                      onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onTouchStart={() => handleTouchStart(rowIndex, colIndex)}
                      style={{ width: cellSize, height: cellSize, backgroundColor }}
                    ></div>
                  );
                })
              )}
            </div>
            <button onClick={() => resetBoard(true)}>
              Reiniciar Tablero
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColoreaElCamino;
