import React, { useState, useEffect, useRef } from 'react';
import './concentrate.css';

const ConcentranteEnElObjetivo = () => {
  const [showIntro, setShowIntro] = useState(true); // Nueva vista inicial
  const [gameStarted, setGameStarted] = useState(false);
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(50);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [stars, setStars] = useState(0);
  const [targetDirection, setTargetDirection] = useState('');
  const [timer, setTimer] = useState(45);
  const [circles, setCircles] = useState([]);
  const circleSize = 55; // Tamaño del círculo
  const directions = ['↑', '↓', '←', '→'];
  const [targetColor, setTargetColor] = useState('');
  const targetDirectionRef = useRef();
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [bonusMultiplier, setBonusMultiplier] = useState(100); // Comienza en 100

  useEffect(() => {
    if (!showIntro) {
      const countdown = setInterval(() => {
        setTimer((prev) => Math.max(prev - 1, 0));
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [showIntro]);

  useEffect(() => {
    if (timer === 0) endGame();
  }, [timer]);

  useEffect(() => {
    if (!showIntro) {
      generateCircles();

      const handleKeyPress = (e) => {
        const directionMap = {
          ArrowUp: '↑',
          ArrowDown: '↓',
          ArrowLeft: '←',
          ArrowRight: '→',
        };
        if (directionMap[e.key]) handleInput(directionMap[e.key]);
      };
      window.addEventListener('keydown', handleKeyPress);

      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [stage, showIntro]);

  const startGame = () => {
    setGameStarted(true);
    setShowIntro(false);
  };

  const generateCircles = () => {
    console.log(stage);
    let newCircles = [];
    const numColumns = Math.max(1, Math.floor(window.innerWidth / (circleSize + 20)) - 6);
    const numRows = Math.max(1, Math.floor(window.innerHeight / (circleSize + 20)));
    const positions = [];
    let targetDir;

    switch (stage) {
      case 1:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;

        console.log(`Debes presionar la flecha: ${targetDir}`);

        newCircles = Array.from({ length: numColumns }).map(() => ({
          direction: targetDir,
          color: 'white',
        }));
        console.log(`nivel: ${stage}`);
        break;

      case 2:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;
        console.log(`Debes presionar la flecha común: ${targetDir}`);

        newCircles = Array.from({ length: numColumns }).map(() => ({
          direction: Math.random() < 0.5 ? targetDir : directions[Math.floor(Math.random() * directions.length)],
          color: 'white',
        }));
        break;

      case 3:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;

        console.log(`Debes presionar la flecha correcta: ${targetDir}`);

        newCircles = Array.from({ length: numColumns }).map((_, index) => ({
          direction: index < 2 ? targetDir : directions[Math.floor(Math.random() * directions.length)],
          color: 'white',
        }));

        newCircles = newCircles.sort(() => Math.random() - 0.5);
        break;

      case 4:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;

        console.log(`Debes deducir la dirección correcta: ${targetDir}`);

        newCircles = Array.from({ length: numColumns }).map(() => ({
          direction: '', // No hay flecha visible
          color: 'white',
        }));
        break;

      case 5:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;

        console.log(`Busca la flecha ${targetDir}`);

        // Generar círculos con flechas aleatorias y color blanco
        newCircles = Array.from({ length: numColumns * numRows }).map(() => ({
          direction: directions[Math.floor(Math.random() * directions.length)], // Flecha aleatoria
          color: 'white', // Color estándar
        }));

        // Seleccionar un círculo aleatorio para ser el correcto
        const targetIndex = Math.floor(Math.random() * newCircles.length);
        newCircles[targetIndex] = {
          direction: targetDir, // Flecha correcta
          color: '#ffffff93', // Color objetivo
        };
        break;
    }

    setCircles(newCircles.map((circle) => {
      let col, row, xPos, yPos;
      do {
        if (stage === 4) {
          // Ajustar para centrar el tablero y aplicar lógica sesgada
          const biasFactor = Math.random() < 0.7 ? targetDir : directions[Math.floor(Math.random() * directions.length)];
          switch (biasFactor) {
            case '↑':
              row = Math.floor(Math.random() * Math.floor(numRows / 3));
              col = Math.floor(Math.random() * (numColumns - 6)) + 3; // Excluye las 3 primeras y últimas columnas
              break;
            case '↓':
              row = Math.floor(numRows * (2 / 3)) + Math.floor(Math.random() * Math.floor(numRows / 3));
              col = Math.floor(Math.random() * (numColumns - 6)) + 3;
              break;
            case '←':
              col = Math.floor(Math.random() * Math.floor((numColumns - 6) / 3)) + 3;
              row = Math.floor(Math.random() * numRows);
              break;
            case '→':
              col = Math.floor((numColumns - 6) * (2 / 3)) + Math.floor(Math.random() * Math.floor((numColumns - 6) / 3)) + 10;
              row = Math.floor(Math.random() * numRows);
              break;
            default:
              col = Math.floor(Math.random() * (numColumns - 6)) + 3;
              row = Math.floor(Math.random() * numRows);
              break;
          }
        } else {
          col = Math.floor(Math.random() * numColumns) + 3;
          row = Math.floor(Math.random() * numRows);
        }

        xPos = col * (circleSize + 20);
        yPos = row * (circleSize + 20);
      } while (positions.some(pos => pos.col === col && pos.row === row));

      positions.push({ col, row });
      return { ...circle, x: xPos, y: yPos };
    }));

    setTotalCards((prev) => prev + 1);
  };

  const handleInput = (direction) => {
    console.log(`El jugador presionó: ${direction}`);
    console.log(`Debes presionar la flecha: ${targetDirectionRef.current}`);

    let isCorrect = false;

    // Validación utilizando la referencia
    switch (stage) {
      case 1:
        isCorrect = direction === targetDirectionRef.current;
        break;

      case 2:
        isCorrect = direction === targetDirectionRef.current;

        break;
      case 3:
        isCorrect = direction === targetDirectionRef.current;
        break;
      case 4:
        isCorrect = direction === targetDirectionRef.current;
        break;
      case 5:
        isCorrect = direction === targetDirectionRef.current;
        break;
      default:
        break;
    }

    if (isCorrect) {
      setScore((prev) => prev + 50); // Aumentar por acierto
  
      setConsecutiveCorrectAnswers((prev) => {
        const newCorrectAnswers = prev + 1;
  
        if (newCorrectAnswers % 4 === 0) {
          setBonusMultiplier((prevMultiplier) => prevMultiplier + 50); // Incrementar el multiplicador de bonificación
          setScore((prevScore) => prevScore + bonusMultiplier); // Aplicar la bonificación
          setStars((prevStars) => Math.min(prevStars + 1, 45));
          setStage((prevStage) => (prevStage < 5 ? prevStage + 1 : prevStage));
        }
  
        return newCorrectAnswers;
      });
    } else {
      setStars((prev) => Math.max(prev - 1, 0));
      setConsecutiveCorrectAnswers(0);
      setBonusMultiplier(100); // Reiniciar la bonificación
    }

    generateCircles();
  };

  const endGame = () => {
    alert(`¡Juego terminado! Puntaje final: ${score}. Precisión: ${Math.round((correctAnswers / totalCards) * 100)}%`);
  };

  return (
    <div className="concentrate-body">
      {!gameStarted ? (
        <div className="concentrate-instructions">
          <h1>Concentrante en el Objetivo</h1>
          <p>
            Bienvenido a "Concentrante en el Objetivo", un juego que pondrá a prueba tu atención focalizada, velocidad de procesamiento y precisión.
            Sigue las instrucciones a continuación y prepárate para el desafío.
          </p>

          <h2>¿Cómo jugar?</h2>
          <ul>
            <li>Debes seleccionar la dirección correcta de las flechas en pantalla, usando el teclado o haciendo clic en la dirección correcta.</li>
            <li>El juego dura 45 segundos. Intenta acumular tantos puntos como sea posible.</li>
          </ul>

          <h2>Niveles del juego:</h2>
          <ol>
            <li>
              <strong>Nivel 1:</strong> Todos los círculos tienen flechas apuntando en la misma dirección. Selecciona esa dirección.
            </li>
            <li>
              <strong>Nivel 2:</strong> Flechas en diferentes direcciones, pero todas coinciden en una dirección correcta. Encuentra y selecciona esa dirección.
            </li>
            <li>
              <strong>Nivel 3:</strong> Solo dos flechas apuntan en la misma dirección. Encuentra esas flechas y selecciona la dirección correcta.
            </li>
            <li>
              <strong>Nivel 4:</strong> No hay flechas visibles. Debes deducir la dirección correcta con las pistas visuales.
            </li>
            <li>
              <strong>Nivel 5:</strong> Aparecen flechas con colores. Debes elegir la flecha que coincida con el color objetivo.
            </li>
          </ol>

          <h2>Puntuación y bonificaciones:</h2>
          <ul>
            <li>Obtienes 50 puntos por cada respuesta correcta.</li>
            <li>Por cada 4 aciertos consecutivos, subes de nivel y recibes bonificaciones adicionales (+100, +150, etc.).</li>
            <li>Un error te hace perder una estrella acumulada.</li>
          </ul>

          <h2>¡Prepárate para el desafío!</h2>
          <p>Cuando estés listo, haz clic en el botón para comenzar.</p>
          <button className="concentrate-start-button" onClick={startGame}>Comenzar Juego</button>
        </div>
      ) : (
        <>
          <div className="concentrate-game-info">
            <p>Puntaje: {score}</p>
            <p>Estrellas: {stars}</p>
            <p>Tiempo restante: {timer}s</p>
            <p>Precisión: {Math.round((correctAnswers / totalCards) * 100) || 0}%</p>
          </div>
          <div className="concentrate-game-area">
            {circles.map((circle, index) => (
              <div
                key={index}
                className="concentrate-circle"
                style={{
                  backgroundColor: circle.color,
                  position: 'absolute',
                  top: `${circle.y}px`,
                  left: `${circle.x}px`,
                  width: `${circleSize}px`,
                  height: `${circleSize}px`,
                }}
              >
                <span>{circle.direction}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ConcentranteEnElObjetivo;