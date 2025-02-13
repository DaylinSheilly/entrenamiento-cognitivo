import React, { useState, useEffect } from "react";
import "./concentrarse.css";

// Lista de direcciones posibles
const directions = ["up", "down", "left", "right"];

// Posiciones iniciales fijas para los círculos (6 posiciones distribuidas)
const fixedPositions = [
  { top: 10, left: 20 },
  { top: 10, left: 70 },
  { top: 40, left: 20 },
  { top: 40, left: 70 },
  { top: 70, left: 20 },
  { top: 70, left: 70 },
];

// Función para obtener una dirección aleatoria
const getRandomDirection = () => directions[Math.floor(Math.random() * directions.length)];

// Función para obtener un color aleatorio
const getRandomColor = () => (Math.random() > 0.5 ? "yellow" : "green");

const ConcentrarseEnElObjetivo = () => {
  const [circles, setCircles] = useState([]);
  const [score, setScore] = useState(0);
  const [currentDirection, setCurrentDirection] = useState(getRandomDirection());
  const [arrowDirection, setArrowDirection] = useState(getRandomDirection()); // Dirección común de flecha

  // Inicializar círculos en posiciones fijas
  useEffect(() => {
    generateCircles();
  }, []);

  const generateCircles = () => {
    const newDirection = getRandomDirection(); // Nueva dirección compartida
    const newArrowDirection = getRandomDirection(); // Dirección de flecha compartida
    const newColor = getRandomColor(); // Color compartido
    setCurrentDirection(newDirection); // Actualizamos la dirección de movimiento
    setArrowDirection(newArrowDirection); // Actualizamos la dirección de la flecha

    const newCircles = fixedPositions.map((pos) => ({
      color: newColor, // Todos los círculos comparten el mismo color
      moveDirection: newDirection, // Todos comparten la misma dirección de movimiento
      arrowDirection: newArrowDirection, // Todos comparten la misma dirección de flecha
      position: { ...pos }, // Posición fija
    }));

    setCircles(newCircles);
  };

  const detectCollision = (newPosition, otherCircles) => {
    return otherCircles.some((circle) => {
      const dx = Math.abs(circle.position.left - newPosition.left);
      const dy = Math.abs(circle.position.top - newPosition.top);
      return dx < 10 && dy < 10; // Consideramos una distancia menor a 10% como colisión
    });
  };

  const moveCircles = () => {
    setCircles((prevCircles) =>
      prevCircles.map((circle, index, allCircles) => {
        const newPosition = { ...circle.position };
        const step = 1; // Reducimos la velocidad a la mitad

        // Actualizar posición basada en la dirección compartida
        if (currentDirection === "up") newPosition.top -= step;
        if (currentDirection === "down") newPosition.top += step;
        if (currentDirection === "left") newPosition.left -= step;
        if (currentDirection === "right") newPosition.left += step;

        // Mantener los círculos dentro de los límites
        newPosition.top = Math.max(0, Math.min(90, newPosition.top));
        newPosition.left = Math.max(0, Math.min(90, newPosition.left));

        // Verificar si el nuevo movimiento colisionará con otros círculos
        const otherCircles = allCircles.filter((_, i) => i !== index);
        if (detectCollision(newPosition, otherCircles)) {
          return circle; // Si hay colisión, no se mueve
        }

        return { ...circle, position: newPosition };
      })
    );
  };

  useEffect(() => {
    const interval = setInterval(moveCircles, 100); // Mueve los círculos cada 100ms
    return () => clearInterval(interval);
  }, [currentDirection]);

  const handleKeyPress = (e) => {
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
  
    const pressedDirection = keyMap[e.key];
    if (!pressedDirection) return;
  
    const correct = circles.every((circle) => {
      if (circle.color === "yellow") {
        // Círculos amarillos: comparar con la dirección de las flechas
        return arrowDirection === pressedDirection;
      } else if (circle.color === "green") {
        // Círculos verdes: comparar con la dirección de movimiento
        return currentDirection === pressedDirection;
      }
      return false;
    });
  
    if (correct) {
      setScore(score + 1); // Incrementa el puntaje si es correcto
    } else {
      setScore(score - 1); // Penaliza si es incorrecto
    }
  
    generateCircles(); // Genera una nueva ronda de círculos
  };
  

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [circles, currentDirection, arrowDirection, score]);

  return (
    <div className="concentrarse-body">
      <div className="concentrarse-game-container">
        <h2 className="concentrarse-score">Score: {score}</h2>
        <div className="concentrarse-circle-container">
          {circles.map((circle, index) => (
            <Circle key={index} {...circle} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente Circle
const Circle = ({ color, arrowDirection, position }) => {
  const directionArrows = {
    up: "↑",
    down: "↓",
    left: "←",
    right: "→",
  };

  return (
    <div
      className={`concentrarse-circle ${color}`}
      style={{
        top: `${position.top}%`,
        left: `${position.left}%`,
        position: "absolute",
      }}
    >
      <span>{directionArrows[arrowDirection]}</span>
    </div>
  );
};

export default ConcentrarseEnElObjetivo;
