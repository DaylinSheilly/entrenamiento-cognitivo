import React, { useState, useEffect } from 'react';
import './colorea-el-camino.css';

const ColoreaElCamino = () => {
  // Estado global: tiempo de inicio del juego (se declara UNA sola vez)
  const [gameStartTime] = useState(Date.now());

  // Estado para el nivel actual
  const [nivel, setNivel] = useState(1);

  // Al iniciar el nivel, generamos y almacenamos la configuración inicial.
  const [initialLevelConfig, setInitialLevelConfig] = useState(() => initializeLevel(1));
  // levelConfig se utiliza en la partida actual; se restaura a partir de initialLevelConfig en caso de error.
  const [levelConfig, setLevelConfig] = useState(initialLevelConfig);

  const { grid, activeBlocks, numRows, numCols } = levelConfig;

  // Estados para evaluar el rendimiento global
  const [resolutionTime, setResolutionTime] = useState(null);
  const [totalErrors, setTotalErrors] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentLevelTime, setCurrentLevelTime] = useState(0);

  // Estados para medir el tiempo de recuperación (por error).
  const [recoveryStart, setRecoveryStart] = useState(null);
  const [recoveryTimes, setRecoveryTimes] = useState([]);

  // Estados para la propagación
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(null);

  // Estado para medir el tiempo de resolución de cada nivel (se reinicia en cada nivel).
  const [startTime, setStartTime] = useState(Date.now());

  /**
   * Función que inicializa la configuración del nivel según el número de nivel.
   * Retorna un objeto con: grid, activeBlocks (lista de bloques activos) y dimensiones.
   */
  function initializeLevel(level) {
    let rows = 10, cols = 10;
    let obstaclesProbability = 0;
    let activeBlocks = [];

    if (level === 1) {
      obstaclesProbability = 0;
      activeBlocks = [
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2), id: 1, color: "blue", headColor: "lightblue" }
      ];
    } else if (level === 2) {
      obstaclesProbability = 0;
      activeBlocks = [
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2) - 1, id: 1, color: "blue", headColor: "lightblue" },
        { row: Math.floor(rows / 2), col: Math.floor(cols / 2) + 1, id: 2, color: "green", headColor: "lightgreen" }
      ];
    } else if (level === 3) {
      // Nivel 3: Mapa estático no cuadrado (10×8) con huecos fijos.
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
      // Niveles Avanzados (nivel >= 4)
      obstaclesProbability = 0.15;
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
    }

    // Crear la cuadrícula (inicialmente vacía: 0)
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

    // Colocar obstáculos en función de obstaclesProbability, salvo en celdas de bloques iniciales y evitando diagonales.
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (obstaclesProbability > 0 && (i === 0 || i === rows - 1 || j === 0 || j === cols - 1)) {
          continue;
        }
        const isInitial = activeBlocks.some(block => block.row === i && block.col === j);
        // Evitar colocar un obstáculo si ya existe uno en diagonales inmediatas o a 2 celdas.
        if (i > 0 && j > 0 && grid[i - 1][j - 1] === -1) continue;
        if (i > 0 && j < cols - 1 && grid[i - 1][j + 1] === -1) continue;
        if (i > 1 && j > 1 && grid[i - 2][j - 2] === -1) continue;
        if (i > 1 && j < cols - 2 && grid[i - 2][j + 2] === -1) continue;

        // Evitar diagonal con la posición inicial de las cabezas (inmediata y a 2 celdas).
        for (let block of activeBlocks) {
          if (Math.abs(i - block.row) === 1 && Math.abs(j - block.col) === 1) continue;
          if (Math.abs(i - block.row) === 2 && Math.abs(j - block.col) === 2) continue;
        }

        if (!isInitial && Math.random() < obstaclesProbability) {
          grid[i][j] = -1;
        }
      }
    }

    // Asegurar número par de obstáculos
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

    // Ubicar los bloques iniciales en el grid
    activeBlocks.forEach(block => {
      grid[block.row][block.col] = block.id;
    });

    return { grid, activeBlocks, numRows: rows, numCols: cols };
  }

  // useEffect para inicializar / cambiar de nivel
  useEffect(() => {
    const newConfig = initializeLevel(nivel);
    setInitialLevelConfig(newConfig);
    setLevelConfig(newConfig);
    setStartTime(Date.now());
    setResolutionTime(null);
    setRecoveryTimes([]);
    setRecoveryStart(null);
  }, [nivel]);

  // Reinicia el tablero
  const resetBoard = (incrementError = false) => {
    if (incrementError) {
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

  // Avanzar al siguiente nivel
  const nextLevel = () => {
    const levelTime = Date.now() - startTime;
    setResolutionTime(levelTime);
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

  // Verifica adyacencia (movimientos horizontales o verticales)
  const isAdjacent = (cell1, cell2) => {
    return Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col) === 1;
  };

  // Celdas disponibles (valor 0) para la cabeza activa
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
      if (newRow < 0 || newRow >= numRows || newCol < 0 || newCol >= numCols) return false;
      return levelConfig.grid[newRow][newCol] === 0;
    });
  };

  // Inicio de la propagación (mouse down)
  const handleMouseDown = (row, col) => {
    const index = activeBlocks.findIndex(block => block.row === row && block.col === col);
    if (index !== -1) {
      setCurrentBlockIndex(index);
      setIsDrawing(true);
    }
  };

  // Propagación al mover el mouse
  const handleMouseEnter = (row, col) => {
    if (!isDrawing || currentBlockIndex === null) return;
    if (levelConfig.grid[row][col] !== 0) return;

    const currentBlock = activeBlocks[currentBlockIndex];
    if (!isAdjacent(currentBlock, { row, col })) {
      console.log("Movimiento no adyacente. Error contado.");
      setTotalErrors(prev => prev);
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

  // Manejo de mouse up
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDrawing(false);
      setCurrentBlockIndex(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Verifica si el tablero está completo
  useEffect(() => {
    const gridFull = levelConfig.grid.every(row => row.every(cell => cell !== 0));
    if (gridFull) {
      console.log("¿Tablero completo? => siguiente nivel.");
      nextLevel();
    }
  }, [levelConfig.grid]);

  // Verifica si las cabezas están bloqueadas
  useEffect(() => {
    const gridFull = levelConfig.grid.every(row => row.every(cell => cell !== 0));
    if (gridFull) return;

    const allBlocked = activeBlocks.every(block => getAvailableMoves(block).length === 0);
    if (allBlocked) {
      if (!recoveryStart) {
        setRecoveryStart(Date.now());
      }
      console.log("Todas las cabezas bloqueadas => reiniciar tablero con error.");
      setTimeout(() => resetBoard(true), 500);
    }
  }, [levelConfig.grid, activeBlocks, recoveryStart]);

  useEffect(() => {
    if (!gameOver && resolutionTime === null) {
      const interval = setInterval(() => {
        setCurrentLevelTime(Date.now() - startTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [startTime, gameOver, resolutionTime]);

  // Estilo en línea de la cuadrícula
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
    // Calculamos el tiempo total de juego en segundos (redondeado)
    const totalGameTimeSeconds = Math.round((Date.now() - gameStartTime) / 1000);
    // Calculamos el tiempo promedio de recuperación en segundos (si hubo errores)
    const avgRecoveryTimeSeconds =
      recoveryTimes.length > 0
        ? Math.round(recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length / 1000)
        : 0;

    return (
      <div className="gameover-container">
        <h1 className="gameover-title">¡Juego Terminado!</h1>
        <h2 className="gameover-subtitle">Resumen de Rendimiento</h2>
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
        Completa el rompecabezas dibujando líneas entre bloques de colores para cubrir toda el área sin dejar huecos.
      </p>
      <p className="colores-descripcion">
        Controles: Usa el botón izquierdo del mouse (o toca en dispositivos táctiles) para arrastrar desde una celda activa a celdas adyacentes.
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
                // Si es la cabeza, color especial (headColor); si no, color normal
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
