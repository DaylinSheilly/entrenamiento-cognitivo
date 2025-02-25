import React, { useState, useEffect, useCallback } from 'react';
import './colorea-el-camino.css';

const ColoreaElCamino = () => {
  // Estado global: tiempo de inicio del juego (no se reinicia)
  const [gameStartTime] = useState(Date.now());

  // Estado para el nivel actual
  const [nivel, setNivel] = useState(1);

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

  // FUNCIONES DE LÓGICA DEL JUEGO -------------------------------------------- //

  // Función para inicializar el nivel
  const initializeLevel = useCallback((level) => {
    let rows = 10, cols = 10;
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
      // Niveles 4 en adelante: generación dinámica del mapa

      // Elegir tamaño del mapa aleatoriamente entre 7x7 y 9x9
      cols = Math.floor(Math.random() * 3) + 7;
      rows = Math.floor(Math.random() * 3) + 7;

      // Probabilidad de obstáculos aumenta con el nivel (hasta un límite del 30%)
      obstaclesProbability = Math.min(0.05 + (level - 3) * 0.05, 0.3);

      // Número de cabezas aumenta con el nivel (máximo 4)
      let numHeads = Math.min(2 + Math.floor(level / 3), 4);

      function generateMap() {
        let tempGrid = Array.from({ length: rows }, () => Array(cols).fill(0));
        let tempActiveBlocks = [];

        // Colocar cabezas en posiciones aleatorias
        for (let i = 0; i < numHeads; i++) {
          let r, c;
          do {
            r = Math.floor(Math.random() * rows);
            c = Math.floor(Math.random() * cols);
          } while (tempGrid[r][c] !== 0); // Evitar repetir posiciones

          let colors = ["blue", "green", "red", "yellow"];
          let headColors = ["lightblue", "lightgreen", "salmon", "lightyellow"];
          tempActiveBlocks.push({ row: r, col: c, id: i + 1, color: colors[i], headColor: headColors[i] });
          tempGrid[r][c] = i + 1;
        }

        // Colocar obstáculos aleatorios basados en obstaclesProbability
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (tempGrid[r][c] === 0 && Math.random() < obstaclesProbability) {
              tempGrid[r][c] = -1; // -1 representa un obstáculo
            }
          }
        }

        return { tempGrid, tempActiveBlocks };
      }

      let mapData;
      // Se genera el mapa hasta que sea solucionable
      do {
        mapData = generateMap();
      } while (!solveAndPrintMap(mapData.tempGrid, mapData.tempActiveBlocks));

      return { grid: mapData.tempGrid, activeBlocks: mapData.tempActiveBlocks, numRows: rows, numCols: cols };
    }
  }, []);
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

    // Inicializamos la cola con todas las cabezas activas
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

    // Usamos un índice para evitar queue.shift()
    let index = 0;
    while (index < queue.length) {
      const { row, col, id } = queue[index++];

      // Asignamos el id a la celda en el mapa solucionado
      solvedMap[row][col] = id;

      // Expandimos a las celdas adyacentes
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

    // Imprimimos el mapa solucionado si es soluble
    if (allReachable) {
      console.log("solveAndPrintMap: El mapa es solucionable. Mapa solucionado:");
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
    } else {
      console.error("solveAndPrintMap: El mapa NO es solucionable.");
    }

    return allReachable;
  }

  // Reinicia el nivel usando la configuración inicial.
  const resetBoard = useCallback((incrementError = false) => {
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
  }, [recoveryStart, initialLevelConfig]);

  // Al completar el nivel, se registra el tiempo y se pasa al siguiente nivel.
  const nextLevel = useCallback(() => {
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
  }, [nivel, recoveryStart, startTime]);

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
    const gridFull = levelConfig.grid.every(row =>
      row.every(cell => cell !== 0)
    );
    console.log("¿Tablero completo?", gridFull);
    if (gridFull) {
      nextLevel();
    }
  }, [levelConfig.grid, nextLevel]);

  useEffect(() => {
    // Si el tablero está completo, no se reinicia.
    const gridFull = levelConfig.grid.every(row => row.every(cell => cell !== 0));
    if (gridFull) return;

    // Verificar que cada cabeza tenga algún movimiento disponible.
    const allBlocked = activeBlocks.every(block => getAvailableMoves(block).length === 0);

    if (allBlocked) {
      // Si es la primera vez que se detecta bloqueo en este nivel, iniciar medición de recuperación.
      if (!recoveryStart) {
        setRecoveryStart(Date.now());
      } else {
        // Si ya se estaba midiendo, reiniciar la medición (sin sumar error nuevamente)
        setRecoveryStart(Date.now());
      }
      console.log("Todas las cabezas están bloqueadas. Reiniciando nivel por error.");
      setTimeout(() => resetBoard(true), 500);
    }
  }, [levelConfig.grid, activeBlocks, recoveryStart, getAvailableMoves, resetBoard]);

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
      <div className="colores-gameover-container">
        <h1 className="colores-gameover-title">¡Juego Terminado!</h1>
        <h2 className="colores-gameover-subtitle">Resumen de Rendimiento Global</h2>
        <div className="colores-gameover-stats">
          <div className="colores-stat">
            <span className="colores-stat-label">Tiempo Total:</span>
            <span className="colores-stat-value">{totalGameTimeSeconds} s</span>
          </div>
          <div className="colores-stat">
            <span className="colores-stat-label">Cantidad de Errores:</span>
            <span className="colores-stat-value">{totalErrors}</span>
          </div>
          <div className="colores-stat">
            <span className="colores-stat-label">Tiempo Promedio de Recuperación:</span>
            <span className="colores-stat-value">{avgRecoveryTimeSeconds} s</span>
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
        onMouseDown={(e) => e.preventDefault()} // Evita selecciones inesperadas
        onMouseLeave={() => setIsDrawing(false)} // Detiene la acción si el cursor sale del área
        onMouseUp={handleMouseUp} // Asegura que se detiene correctamente
        onTouchEnd={handleTouchEnd} // Finaliza el dibujo en pantallas táctiles
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
