import React, { useState, useEffect } from "react";
import "./construye-la-pipe.css";
import levelsData from "./maps.json";

const App = () => {
  const [grid, setGrid] = useState([]);
  const [gridSize, setGridSize] = useState(5);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levels, setLevels] = useState([]);

  // Cargar niveles desde el archivo JSON
  useEffect(() => {
    setLevels(levelsData);
    loadLevel(levelsData[currentLevel]);
  }, []);

  const loadLevel = (level) => {
    if (!level) {
      console.error("Nivel no encontrado");
      return;
    }

    setGridSize(level.gridSize);

    // Crear la cuadrícula y colocar los elementos desde el JSON
    const newGrid = Array.from({ length: level.gridSize }, (_, x) =>
      Array.from({ length: level.gridSize }, (_, y) => {
        const element = level.elements.find((el) => el.x === x && el.y === y);
        return (
          element || {
            type: "empty", // Celda vacía
            rotation: 0,
            locked: true,
          }
        );
      })
    );

    setGrid(newGrid);
  };

  const rotatePiece = (x, y) => {
    setGrid((prevGrid) => {
      const newGrid = prevGrid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          if (rowIndex === x && colIndex === y && !cell.locked) {
            const updatedCell = { ...cell, rotation: (cell.rotation + 90) % 360 };
  
            // TODO 🔽🔽🔽 MODIFICACIÓN SOLO PARA VERIFICACIÓN 🔽🔽🔽
          console.log(
            `{ "x": ${x}, "y": ${y}, "type": "${updatedCell.type}", "rotation": ${updatedCell.rotation} }`
          );
            // TODO 🔼🔼🔼 FIN DE MODIFICACIÓN DE VERIFICACIÓN 🔼🔼🔼
  
            return updatedCell;
          }
          return cell;
        })
      );
      return newGrid;
    });
  };
  

  const verifySolution = () => {
    const currentAnswer = levels[currentLevel].answer;
  
    for (const answerCell of currentAnswer) {
      const { x, y, type, rotation } = answerCell;
      const cell = grid[x][y];
  
      console.log(
        `Evaluando celda en (${x}, ${y}) - Tipo actual: ${cell?.type}, Rotación actual: ${cell?.rotation}, Tipo esperado: ${type}, Rotación esperada: ${rotation}`
      );
  
      if (!cell || cell.type !== type) {
        console.log(`❌ Celda en (${x}, ${y}) tiene un tipo incorrecto.`);
        return false;
      }
  
      if (type === "pipe") {
        if (cell.rotation !== rotation && cell.rotation !== (rotation + 180) % 360) {
          console.log(
            `❌ Celda en (${x}, ${y}) tiene una rotación incorrecta. Rotaciones válidas: ${rotation}, ${(rotation + 180) % 360}`
          );
          return false;
        }
      } else if (type === "pipe-angle" || type === "pipe-T") {
        if (cell.rotation !== rotation) {
          console.log(
            `❌ Celda en (${x}, ${y}) tiene una rotación incorrecta. Rotación válida: ${rotation}`
          );
          return false;
        }
      } else if (type === "pipe-cross") {
        console.log(`✅ Celda en (${x}, ${y}) es un 'pipe-cross', la rotación no importa.`);
      }
    }
  
    console.log("✅ Todas las celdas están correctamente posicionadas.");
    return true;
  };

  const startFlow = () => {
    if (verifySolution()) {
      alert("¡Nivel completado!");
      setScore((prev) => prev + 100);
      nextLevel();
    } else {
      alert("¡La conexión tiene errores! Reintenta.");
      setErrors((prev) => prev + 1);
    }
  };

  const resetLevel = () => {
    setScore(0);
    setErrors(0);
    loadLevel(levels[currentLevel]);
  };

  const nextLevel = () => {
    if (currentLevel < levels.length - 1) {
      setCurrentLevel((prev) => prev + 1);
      loadLevel(levels[currentLevel + 1]);
    } else {
      alert("¡Has completado todos los niveles!");
    }
  };

  return (
    <div className="pipe-app">
      <header className="pipe-header">
        <h1 className="pipe-title">Construye la Cañería</h1>
        <div className="pipe-controls">
          <button className="pipe-button" onClick={startFlow}>
            Iniciar flujo
          </button>
          <button className="pipe-button" onClick={resetLevel}>
            Reiniciar nivel
          </button>
          <button className="pipe-button" onClick={nextLevel}>
            Siguiente nivel
          </button>
        </div>
        <div className="pipe-status">
          <p className="pipe-score">Puntaje: {score}</p>
          <p className="pipe-errors">Errores: {errors}</p>
        </div>
      </header>
      <main className="pipe-main">
        <div
          className="pipe-grid"
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {grid.map((row, x) =>
            row.map((cell, y) => (
              <div
                key={`${x}-${y}`}
                className={`pipe-cell pipe-${cell.type}`}
                style={{ transform: `rotate(${cell.rotation}deg)` }}
                onClick={() => rotatePiece(x, y)}
              >
                {cell.type === "source" && "💧"}
                {cell.type === "plant" && "🌱"}
                {cell.type === "pipe" && "|"}
                {cell.type === "pipe-angle" && "L"}
                {cell.type === "pipe-T" && "⊤"}
                {cell.type === "pipe-cross" && "✚"}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
