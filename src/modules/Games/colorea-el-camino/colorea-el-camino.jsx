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
  // Estados para medir el tiempo de recuperación (por error).
  const [recoveryStart, setRecoveryStart] = useState(null);
  const [recoveryTimes, setRecoveryTimes] = useState([]);

  // Estados para la propagación: se permite "dibujar" a partir de la(s) cabeza(s) de bloque.
  // currentBlockIndex indica cuál bloque (de activeBlocks) está activo para propagar.
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(null);
  // Estado para medir el tiempo de resolución de cada nivel (se reinicia en cada nivel).
  const [startTime, setStartTime] = useState(Date.now());

  // Función que inicializa la configuración del nivel según el número de nivel.
  // Retorna un objeto con: grid, activeBlocks (lista de bloques activos) y dimensiones.
  function initializeLevel(level) {
    let rows = 10, cols = 10;
    let obstaclesProbability = 0;
    let activeBlocks = [];
    if (level === 1) {
      // Nivel 1: Mapa cuadrado sin obstáculos, un solo bloque en el centro.
      obstaclesProbability = 0;
      activeBlocks = [
        {
          row: Math.floor(rows / 2),
          col: Math.floor(cols / 2),
          id: 1,
          color: "blue",
          headColor: "lightblue"
        }
      ];
    } else if (level === 2) {
      // Nivel 2: Mapa cuadrado sin obstáculos, dos bloques de colores diferentes.
      obstaclesProbability = 0;
      activeBlocks = [
        {
          row: Math.floor(rows / 2),
          col: Math.floor(cols / 2) - 1,
          id: 1,
          color: "blue",
          headColor: "lightblue"
        },
        {
          row: Math.floor(rows / 2),
          col: Math.floor(cols / 2) + 1,
          id: 2,
          color: "green",
          headColor: "lightgreen"
        }
      ];
    } else if (level === 3) {
      // Nivel 3: Mapa estático no cuadrado (10×8) con huecos fijos.
      cols = 8;
      obstaclesProbability = 0;
      const staticGridLevel3 = [
        [0,  0, -1,  0,  0,  0,  0, -1],
        [0,  0,  0,  0,  0,  0,  0,  0],
        [0,  0,  0,  0,  0,  0,  0,  0],
        [0,  0, -1,  0,  0,  0,  0, -1],
        [0,  0,  0,  0, -1,  0,  0,  0],
        [0,  0,  0,  0,  0,  0,  0,  0],
        [0, -1,  0,  0,  0,  0,  0, -1],
        [0,  0,  0, -1,  0,  0,  0,  0],
        [0,  0,  0,  0,  0,  0,  0,  0],
        [0,  0,  0,  0,  0, -1,  0,  0]
      ];
      activeBlocks = [
        {
          row: Math.floor(rows / 2),
          col: Math.floor(cols / 2),
          id: 1,
          color: "blue",
          headColor: "lightblue"
        }
      ];
      const grid = staticGridLevel3.map(r => r.slice());
      // Aseguramos que la celda del bloque inicial tenga el id del bloque.
      grid[activeBlocks[0].row][activeBlocks[0].col] = activeBlocks[0].id;
      return { grid, activeBlocks, numRows: rows, numCols: cols };
    } else {
      // Niveles Avanzados (nivel >= 4): Mapa cuadrado (10×10) con obstáculos (15%) y varios bloques.
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
          {
            row: Math.floor(rows / 2),
            col: Math.floor(cols / 2),
            id: 1,
            color: "blue",
            headColor: "lightblue"
          }
        ];
      }
    }
    // Crear la cuadrícula (inicialmente vacía: 0)
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    // Colocar obstáculos en función de obstaclesProbability, salvo en celdas de bloques iniciales.
    // Se evitan obstáculos en los bordes del mapa.
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (obstaclesProbability > 0 && (i === 0 || i === rows - 1 || j === 0 || j === cols - 1)) {
          continue;
        }
        const isInitial = activeBlocks.some(block => block.row === i && block.col === j);
        // Evitar colocar un obstáculo si ya existe uno en las diagonales superiores inmediatas.
        if (i > 0 && j > 0 && grid[i - 1][j - 1] === -1) continue;
        if (i > 0 && j < cols - 1 && grid[i - 1][j + 1] === -1) continue;
        // Además, evitar colocar un obstáculo si ya existe uno en una posición diagonal a 2 celdas de diferencia.
        if (i > 1 && j > 1 && grid[i - 2][j - 2] === -1) continue;
        if (i > 1 && j < cols - 2 && grid[i - 2][j + 2] === -1) continue;
        if (!isInitial && Math.random() < obstaclesProbability) {
          grid[i][j] = -1;
        }
      }
    }
    // Contamos obstáculos y, si la cantidad es impar, eliminamos el primer obstáculo encontrado para dejarla par.
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
    // Ubicar los bloques iniciales en el grid (su valor es su id).
    activeBlocks.forEach(block => {
      grid[block.row][block.col] = block.id;
    });
    return { grid, activeBlocks, numRows: rows, numCols: cols };
  }

  // Cada vez que el nivel cambia, se genera (y almacena) la configuración inicial.
  useEffect(() => {
    const newConfig = initializeLevel(nivel);
    setInitialLevelConfig(newConfig);
    setLevelConfig(newConfig);
    setStartTime(Date.now());
    setResolutionTime(null);
    setRecoveryTimes([]);
    setRecoveryStart(null);
  }, [nivel]);

  // Reinicia el tablero para el mismo nivel usando la configuración inicial almacenada.
  // Si se pasa true a incrementError (por bloqueo o reinicio manual), se suma un error y se mide el tiempo de recuperación.
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

  // Cuando se completa el nivel, se registra el rendimiento y se pasa al siguiente nivel.
  // El juego termina al completar el nivel 10.
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

  // Verifica si dos celdas son adyacentes (solo movimientos horizontales o verticales).
  const isAdjacent = (cell1, cell2) => {
    return (
      Math.abs(cell1.row - cell2.row) + Math.abs(cell1.col - cell2.col) === 1
    );
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

  // Inicio de la propagación: al hacer clic/tocar sobre una celda que contenga un bloque activo,
  // se establece ese bloque como el actual y se activa el modo "dibujar".
  const handleMouseDown = (row, col) => {
    const index = activeBlocks.findIndex(
      block => block.row === row && block.col === col
    );
    if (index !== -1) {
      setCurrentBlockIndex(index);
      setIsDrawing(true);
    }
  };

  // Al mover el mouse sobre una celda, si se está dibujando se valida la expansión del bloque activo.
  const handleMouseEnter = (row, col) => {
    if (!isDrawing || currentBlockIndex === null) return;
    if (levelConfig.grid[row][col] !== 0) return;
    const currentBlock = activeBlocks[currentBlockIndex];
    if (!isAdjacent(currentBlock, { row, col })) {
      console.log("Movimiento no adyacente. Error contado.");
      setTotalErrors(prev => prev + 1);
      return;
    }
    const newGrid = levelConfig.grid.map(r => r.slice());
    newGrid[row][col] = currentBlock.id;
    const newActiveBlocks = activeBlocks.slice();
    newActiveBlocks[currentBlockIndex] = { ...currentBlock, row, col };
    setLevelConfig(prev => ({ ...prev, grid: newGrid, activeBlocks: newActiveBlocks }));
  };

  const handleTouchStart = (row, col) => {
    const index = activeBlocks.findIndex(
      block => block.row === row && block.col === col
    );
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
    const handleMouseUp = () => {
      setIsDrawing(false);
      setCurrentBlockIndex(null);
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Verifica si el tablero está completo (todas las celdas disponibles se han llenado, ignorando obstáculos).
  useEffect(() => {
    const gridFull = levelConfig.grid.every(row => row.every(cell => cell !== 0));
    console.log("¿Tablero completo (o son obstáculos)?", gridFull);
    if (gridFull) {
      nextLevel();
    }
  }, [levelConfig.grid]);

  // VERIFICACIÓN DE ERROR: Se espera a que NINGUNA de las cabezas (todos los bloques activos)
  // tenga movimientos adyacentes disponibles y que el tablero NO esté completo.
  useEffect(() => {
    const gridFull = levelConfig.grid.every(row => row.every(cell => cell !== 0));
    if (gridFull) return;
    const allBlocked = activeBlocks.every(block => getAvailableMoves(block).length === 0);
    if (allBlocked) {
      if (!recoveryStart) {
        setRecoveryStart(Date.now());
      }
      console.log("Todas las cabezas están bloqueadas. Error contado y reiniciando nivel.");
      setTimeout(() => resetBoard(true), 500);
    }
  }, [levelConfig.grid, activeBlocks, recoveryStart]);

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
    const totalGameTime = Date.now() - gameStartTime;
    return (
      <div className="colores-contenedor">
        <h1 className="colores-titulo">¡Juego Terminado!</h1>
        <h2 className="colores-nivel">Resumen de Rendimiento Global</h2>
        <p>Tiempo total de juego: {totalGameTime} ms</p>
        <p>Total de errores: {totalErrors}</p>
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
        Errores (este nivel): {totalErrors} | Tiempo de resolución (nivel): {resolutionTime ? resolutionTime + " ms" : "En progreso..."}
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
        {levelConfig.grid.map((row, rowIndex) =>
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
