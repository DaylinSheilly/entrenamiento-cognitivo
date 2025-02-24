import React, { useState, useEffect } from 'react';
import './colorea-el-camino.css';

const ColoreaElCamino = () => {
  // Estado global: tiempo de inicio del juego (no se reinicia)
  const [gameStartTime] = useState(Date.now());

  // Estado para el nivel actual
  const [nivel, setNivel] = useState(1);
  // Configuración inicial del nivel
  const [initialLevelConfig, setInitialLevelConfig] = useState(() => initializeLevel(1));
  // Configuración actual del nivel
  const [levelConfig, setLevelConfig] = useState(initialLevelConfig);
  const { grid, activeBlocks, numRows, numCols } = levelConfig;

  // Estados de rendimiento global
  const [resolutionTime, setResolutionTime] = useState(null);
  const [totalErrors, setTotalErrors] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentLevelTime, setCurrentLevelTime] = useState(0);

  // Estados para medir tiempo de recuperación (se mide solo si el nivel se reinicia por error)
  const [recoveryStart, setRecoveryStart] = useState(null);
  const [recoveryTimes, setRecoveryTimes] = useState([]);

  // Estados para la propagación
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(null);
  // Tiempo de inicio de cada nivel (se reinicia al cambiar de nivel)
  const [startTime, setStartTime] = useState(Date.now());

  // Función de validación de mapa (BFS, solo 4 direcciones)
  function isMapSolvable(grid, activeHeads) {
    const numRows = grid.length;
    const numCols = grid[0].length;
    const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));

    // Cada serpiente se inicializa con una única cabeza
    let snakes = activeHeads.map(head => [head]);
    snakes.forEach(snake => {
      const head = snake[snake.length - 1];
      visited[head.row][head.col] = true;
    });

    const directions = [
      { row: -1, col: 0 }, // Arriba
      { row: 1, col: 0 },  // Abajo
      { row: 0, col: -1 }, // Izquierda
      { row: 0, col: 1 }   // Derecha
    ];

    function moveSnakes() {
      let moved = false;
      // Se recorre cada serpiente individualmente
      for (let i = 0; i < snakes.length; i++) {
        let snake = snakes[i];
        const head = snake[snake.length - 1];
        // Para cada serpiente, se intenta mover la cabeza en alguna dirección válida
        for (const d of directions) {
          const newRow = head.row + d.row;
          const newCol = head.col + d.col;
          if (
            newRow >= 0 &&
            newRow < numRows &&
            newCol >= 0 &&
            newCol < numCols &&
            grid[newRow][newCol] !== -1 &&
            !visited[newRow][newCol]
          ) {
            // Se mueve la cabeza de la serpiente
            snake.push({ row: newRow, col: newCol });
            visited[newRow][newCol] = true;
            // Se elimina el primer elemento para mantener la longitud constante
            snake.shift();
            moved = true;
            break; // Solo un movimiento por serpiente en esta iteración
          }
        }
        // Si una serpiente no puede moverse, simplemente se queda en su posición actual.
      }
      return moved;
    }

    // Limitamos el número de iteraciones para evitar bucles infinitos
    let maxIterations = numRows * numCols;
    while (maxIterations--) {
      // Cada iteración, todas las serpientes intentan moverse
      if (!moveSnakes()) {
        break; // Si ninguna serpiente se pudo mover, salimos del bucle.
      }
    }

    // Verificamos que todas las celdas accesibles hayan sido visitadas
    let allReachable = true;
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        if (grid[i][j] !== -1 && !visited[i][j]) {
          allReachable = false;
          console.warn(`La celda (${i}, ${j}) no es alcanzable.`);
        }
      }
    }

    if (allReachable) {
      console.log("isMapSolvable: El mapa es solucionable.");
    } else {
      console.error("isMapSolvable: El mapa NO es solucionable.");
    }
    return allReachable;
  }

  function printSolvedMap(grid, activeBlocks) {
    const numRows = grid.length;
    const numCols = grid[0].length;
    // Creamos una copia de la cuadrícula para marcar las celdas alcanzadas.
    const solvedMap = grid.map(row => row.slice());

    // Usamos BFS para recorrer desde todas las cabezas.
    const visited = Array.from({ length: numRows }, () => Array(numCols).fill(false));
    const queue = [];

    activeBlocks.forEach(block => {
      queue.push({ row: block.row, col: block.col, id: block.id });
      visited[block.row][block.col] = true;
    });

    const directions = [
      { row: -1, col: 0 },
      { row: 1, col: 0 },
      { row: 0, col: -1 },
      { row: 0, col: 1 }
    ];

    while (queue.length) {
      const { row, col, id } = queue.shift();
      // Marcar la celda como "solucionada" con el id (o un símbolo)
      solvedMap[row][col] = id;

      for (const d of directions) {
        const newRow = row + d.row;
        const newCol = col + d.col;
        if (
          newRow >= 0 &&
          newRow < numRows &&
          newCol >= 0 &&
          newCol < numCols &&
          grid[newRow][newCol] !== -1 &&  // no es obstáculo
          !visited[newRow][newCol]
        ) {
          visited[newRow][newCol] = true;
          queue.push({ row: newRow, col: newCol, id });
        }
      }
    }

    // Imprimir la matriz en consola. Para cada celda, si es obstáculo, mostramos "X", si no, mostramos el valor.
    console.log("Mapa solucionado:");
    for (let i = 0; i < numRows; i++) {
      let line = "";
      for (let j = 0; j < numCols; j++) {
        if (grid[i][j] === -1) {
          line += " X ";
        } else {
          line += ` ${solvedMap[i][j]} `;
        }
      }
      console.log(line);
    }
  }

  // Función para inicializar el nivel
  function initializeLevel(level) {
    let rows = 10, cols = 10;
    let obstaclesProbability = 0;
    let activeBlocks = [];

    // Niveles 1 y 2: configuración básica.
    if (level === 1) {
      obstaclesProbability = 0;
      activeBlocks = [
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2), id: 1, color: "blue", headColor: "lightblue" }
      ];
      // Creamos un grid sin obstáculos (todas las celdas en 0)
      const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
      // Colocamos el bloque activo
      grid[Math.floor(rows / 2)][Math.floor(cols / 2)] = 1;
      return { grid, activeBlocks, numRows: rows, numCols: cols };

    } else if (level === 2) {
      obstaclesProbability = 0;
      activeBlocks = [
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2) - 1, id: 1, color: "blue", headColor: "lightblue" },
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2) + 1, id: 2, color: "green", headColor: "lightgreen" }
      ];
      // Creamos un grid sin obstáculos (todas las celdas en 0)
      const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
      // Ubicamos los bloques activos en el grid
      grid[Math.floor(rows / 2)][Math.floor(cols / 2) - 1] = 1;
      grid[Math.floor(rows / 2)][Math.floor(cols / 2) + 1] = 2;
      return { grid, activeBlocks, numRows: rows, numCols: cols };

    } else if (level === 3) {
      // Nivel 3: mapa estático, sin obstáculos dinámicos.
      cols = 8;
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
      const grid = staticGridLevel3.map(r => r.slice());
      grid[activeBlocks[0].row][activeBlocks[0].col] = activeBlocks[0].id;
      return { grid, activeBlocks, numRows: rows, numCols: cols };
    } else {
      // Para niveles avanzados (4 en adelante):
      // 1. Incrementamos la densidad de obstáculos. Por ejemplo, iniciamos en 15% para nivel 4 y aumentamos 5% por nivel (máximo, digamos, 50%).
      obstaclesProbability = Math.min(0.15 + 0.05 * (level - 4), 0.5);

      // 2. Variamos la forma del mapa: por ejemplo, para niveles impares (>=5) usamos un mapa rectangular.
      if (level >= 5 && level % 2 === 1) {
        rows = 10;
        cols = 8;
      }

      // 3. Aumentamos el número de bloques activos hasta 4.
      const numBlocks = Math.min(level, 4);
      if (numBlocks === 3) {
        activeBlocks = [
          { row: 0, col: 0, id: 1, color: "blue", headColor: "lightblue" },
          { row: 0, col: cols - 1, id: 2, color: "green", headColor: "lightgreen" },
          { row: rows - 1, col: Math.floor(cols / 2), id: 3, color: "red", headColor: "salmon" }
        ];
      } else if (numBlocks === 4) {
        activeBlocks = [
          { row: 0, col: 0, id: 1, color: "blue", headColor: "lightblue" },
          { row: 0, col: cols - 1, id: 2, color: "green", headColor: "lightgreen" },
          { row: rows - 1, col: 0, id: 3, color: "red", headColor: "salmon" },
          { row: rows - 1, col: cols - 1, id: 4, color: "purple", headColor: "plum" }
        ];
      } else {
        activeBlocks = [
          { row: Math.floor(rows / 2), col: Math.floor(cols / 2), id: 1, color: "blue", headColor: "lightblue" }
        ];
      }
      // Crear la cuadrícula vacía
      const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

      // Colocar obstáculos en función de obstaclesProbability, evitando:
      // - bordes,
      // - celdas de bloques iniciales,
      // - obstáculos en diagonales inmediatas o a dos celdas,
      // - y posiciones diagonales respecto a la posición inicial de las cabezas.
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (obstaclesProbability > 0 && (i === 0 || i === rows - 1 || j === 0 || j === cols - 1)) continue;
          const isInitial = activeBlocks.some(block => block.row === i && block.col === j);
          if (i > 0 && j > 0 && grid[i - 1][j - 1] === -1) continue;
          if (i > 0 && j < cols - 1 && grid[i - 1][j + 1] === -1) continue;
          if (i > 1 && j > 1 && grid[i - 2][j - 2] === -1) continue;
          if (i > 1 && j < cols - 2 && grid[i - 2][j + 2] === -1) continue;
          for (let block of activeBlocks) {
            if (Math.abs(i - block.row) === 1 && Math.abs(j - block.col) === 1) continue;
            if (Math.abs(i - block.row) === 2 && Math.abs(j - block.col) === 2) continue;
          }
          if (!isInitial && Math.random() < obstaclesProbability) {
            grid[i][j] = -1;
          }
        }
      }

      // Asegurar que el número de obstáculos sea par.
      let obstacleCount = 0;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          if (grid[i][j] === -1) obstacleCount++;
        }
      }
      if (obstacleCount % 2 !== 0) {
        for (let i = 0; i < rows; i++) {
          let removed = false;
          for (let j = 0; j < cols; j++) {
            if (grid[i][j] === -1) {
              grid[i][j] = 0;
              removed = true;
              break;
            }
          }
          if (removed) break;
        }
      }

      // Ubicar los bloques iniciales en la cuadrícula.
      activeBlocks.forEach(block => {
        grid[block.row][block.col] = block.id;
      });
    }

    // Validar que el mapa sea solucionable; de lo contrario, regenerar.
    if (!isMapSolvable(grid, activeBlocks)) {
      return initializeLevel(level);
    }

    // Imprimir el mapa solucionado en consola para depuración
    printSolvedMap(grid, activeBlocks);

    return { grid, activeBlocks, numRows: rows, numCols: cols };
  }

  // Cada vez que cambia el nivel, se actualiza la configuración inicial.
  useEffect(() => {
    const newConfig = initializeLevel(nivel);
    setInitialLevelConfig(newConfig);
    setLevelConfig(newConfig);
    setStartTime(Date.now());
    setResolutionTime(null);
    setRecoveryTimes([]);
    setRecoveryStart(null);
  }, [nivel]);

  // Reinicia el nivel usando la configuración inicial.
  const resetBoard = (incrementError = false) => {
    if (incrementError) {
      // Se suma error solo una vez por reinicio válido.
      setTotalErrors(prev => prev + 1);
      if (recoveryStart !== null) {
        const recTime = Date.now() - recoveryStart;
        setRecoveryTimes(prev => [...prev, recTime]);
        setRecoveryStart(null);
      }
    }
    setLevelConfig(initialLevelConfig);
    setIsDrawing(false);
    setCurrentBlockIndex(null);
  };

  // Al completar el nivel, se registra el tiempo y se pasa al siguiente nivel.
  const nextLevel = () => {
    const levelTime = Date.now() - startTime;
    setResolutionTime(levelTime);
    // Si existe una medición de recuperación, la registramos y detenemos la medición.
    if (recoveryStart) {
      const validRecoveryTime = Date.now() - recoveryStart;
      setRecoveryTimes(prev => [...prev, validRecoveryTime]);
      setRecoveryStart(null);
    }
    if (nivel >= 10) {
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
        setRecoveryTimes([]);
        setRecoveryStart(null);
      }, 500);
    }
  };

  // Verifica si dos celdas son adyacentes (solo horizontales o verticales).
  const isAdjacent = (cell1, cell2) => {
    return Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col) === 1;
  };

  // Devuelve las celdas adyacentes disponibles (valor 0) para un bloque.
  const getAvailableMoves = (block) => {
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
  };

  // Inicio de la propagación: al hacer clic/tocar sobre una celda con un bloque activo.
  const handleMouseDown = (row, col) => {
    const index = activeBlocks.findIndex(block => block.row === row && block.col === col);
    if (index !== -1) {
      setCurrentBlockIndex(index);
      setIsDrawing(true);
    }
  };

  // Al mover el mouse sobre una celda, se valida la expansión del bloque activo.
  const handleMouseEnter = (row, col) => {
    if (!isDrawing || currentBlockIndex === null) return;
    if (levelConfig.grid[row][col] !== 0) return;
    const currentBlock = activeBlocks[currentBlockIndex];
    if (!isAdjacent(currentBlock, { row, col })) {
      return;
    }
    const newGrid = levelConfig.grid.map(r => r.slice());
    newGrid[row][col] = currentBlock.id;
    const newActiveBlocks = activeBlocks.slice();
    newActiveBlocks[currentBlockIndex] = { ...currentBlock, row, col };
    setLevelConfig(prev => ({ ...prev, grid: newGrid, activeBlocks: newActiveBlocks }));
  };

  // Eventos táctiles
  const handleTouchStart = (row, col) => {
    const index = activeBlocks.findIndex(block => block.row === row && block.col === col);
    if (index !== -1) {
      setCurrentBlockIndex(index);
      setIsDrawing(true);
    }
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.dataset.row && element.dataset.col) {
      const row = parseInt(element.dataset.row, 10);
      const col = parseInt(element.dataset.col, 10);
      handleMouseEnter(row, col);
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    setCurrentBlockIndex(null);
  };

  useEffect(() => {
    const gridFull = levelConfig.grid.every(row =>
      row.every(cell => cell !== 0)
    );
    console.log("¿Tablero completo?", gridFull);
    if (gridFull) {
      nextLevel();
    }
  }, [levelConfig.grid]);

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

  const cellSize = 40;
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${numCols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${numRows}, ${cellSize}px)`,
    gap: '2px',
    margin: '20px auto',
    width: `${numCols * (cellSize + 2)}px`
  };

  if (gameOver) {
    const totalGameTimeSeconds = Math.round((Date.now() - gameStartTime) / 1000);
    const avgRecoveryTimeSeconds =
      recoveryTimes.length > 0
        ? Math.round(recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length / 1000)
        : 0;
    return (
      <div className="gameover-container">
        <h1 className="gameover-title">¡Juego Terminado!</h1>
        <h2 className="gameover-subtitle">Resumen de Rendimiento Global</h2>
        <div className="gameover-stats">
          <div className="stat">
            <span className="stat-label">Tiempo Total:</span>
            <span className="stat-value">{totalGameTimeSeconds} s</span>
          </div>
          <div className="stat">
            <span className="stat-label">Cantidad de Errores:</span>
            <span className="stat-value">{totalErrors}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Tiempo Promedio de Recuperación:</span>
            <span className="stat-value">{avgRecoveryTimeSeconds} s</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="colores-contenedor">
      <h1 className="colores-titulo">Colorea el camino</h1>
      <h2 className="colores-nivel">Nivel: {nivel}</h2>
      <p className="colores-descripcion">
        Completa el rompecabezas cubriendo todo el área con colores sin dejar huecos.
      </p>
      <p className="colores-descripcion">
        Errores: {totalErrors} | Tiempo de resolución: {currentLevelTime ? Math.round(currentLevelTime / 1000) + " s" : "En progreso..."}
      </p>
      <div
        className="colores-grid"
        style={gridStyle}
        onMouseLeave={() => {
          setIsDrawing(false);
          setCurrentBlockIndex(null);
        }}
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
      <button className="colores-reset-btn" onClick={() => resetBoard(true)}>
        Reiniciar Tablero (Error)
      </button>
    </div>
  );
};

export default ColoreaElCamino;
