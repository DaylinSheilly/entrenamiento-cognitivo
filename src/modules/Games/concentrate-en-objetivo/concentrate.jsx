import React, { useState, useEffect, useRef } from 'react';
import './concentrate.css';

const GAME_TIME = 45; // Tiempo total del juego en segundos

const ConcentranteEnElObjetivo = () => {
  const [showIntro, setShowIntro] = useState(true); // Nueva vista inicial
  const [gameStarted, setGameStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(50);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [stars, setStars] = useState(0);
  const [targetDirection, setTargetDirection] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [timer, setTimer] = useState(GAME_TIME);
  const [circles, setCircles] = useState([]);
  const circleSize = 55; // Tamaño del círculo
  const directions = ['↑', '↓', '←', '→'];
  const [targetColor, setTargetColor] = useState('');
  const targetDirectionRef = useRef();
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [bonusMultiplier, setBonusMultiplier] = useState(100); // Comienza en 100
  const [startTime, setStartTime] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);

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

  const handleKeyPress = (e) => {
    const directionMap = {
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
    };
    if (directionMap[e.key]) handleInput(directionMap[e.key]);
  };

  const startGame = () => {
    setGameStarted(true);
    setStage(1);
    setScore(50);
    setCorrectAnswers(0);
    setTotalErrors(0);
    setTotalCards(0);
    setGameOver(false);
    setStars(0);
    setTargetDirection('');
    setCountdown(null);
    setTimer(GAME_TIME);
    setCircles([]);
    setTargetColor('');
    setConsecutiveCorrectAnswers(0);
    setBonusMultiplier(100);
    setReactionTimes([]);

    generateCircles();
    window.addEventListener('keydown', handleKeyPress);
  };

  useEffect(() => {
    if (gameOver) {
      window.removeEventListener('keydown', handleKeyPress);
    }
  }, [gameOver]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(countdown);
  });

  useEffect(() => {
    if (countdown !== null) return; // Si hay cuenta regresiva, no restar tiempo

    if (timer > 0 && !gameOver && gameStarted) {
      const time = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(time);
    } else if (gameStarted && timer === 0) {
      setGameStarted(false);
      setGameOver(true);
    }
  }, [timer]);

  useEffect(() => {
    generateCircles();
  }, [stage, round]);

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

        const numTarget = Math.ceil(numColumns * 0.6);
        const mixedDirections = [...Array(numTarget).fill(targetDir),
        ...Array(numColumns - numTarget).fill(null)]
          .map(dir => dir ?? directions[Math.floor(Math.random() * directions.length)]);
        newCircles = mixedDirections.map(direction => ({
          direction,
          color: 'white',
        }));
        break;

      case 3:
        targetDir = directions[Math.floor(Math.random() * directions.length)];
        setTargetDirection(targetDir);
        targetDirectionRef.current = targetDir;

        console.log(`Debes presionar la flecha correcta: ${targetDir}`);

        // Generar direcciones aleatorias excluyendo la dirección objetivo
        const directionsSet = Array.from({ length: numColumns }).map(() => {
          let randomDir;
          do {
            randomDir = directions[Math.floor(Math.random() * directions.length)];
          } while (randomDir === targetDir); // Evitar la dirección objetivo
          return randomDir;
        });

        // Elegir dos posiciones aleatorias para asignarles la dirección objetivo
        const indices = [];
        while (indices.length < 2) {
          const randomIndex = Math.floor(Math.random() * numColumns);
          if (!indices.includes(randomIndex)) indices.push(randomIndex);
        }

        // Asignar la dirección objetivo a esas posiciones
        indices.forEach(index => directionsSet[index] = targetDir);

        // Crear los círculos con las direcciones asignadas
        newCircles = directionsSet.map(direction => ({
          direction,
          color: 'white',
        }));

        // Mezclar los círculos para mayor aleatoriedad
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

        // Generar círculos con fondo negro y flechas blancas en direcciones aleatorias
        newCircles = Array.from({ length: numColumns * numRows }).map(() => ({
          direction: directions[Math.floor(Math.random() * directions.length)], // Flecha aleatoria
          color: 'black', // Fondo negro
          arrowColor: 'white' // Flechas blancas
        }));

        // Seleccionar un círculo al azar para la flecha verde correcta
        const targetIndex = Math.floor(Math.random() * newCircles.length);
        newCircles[targetIndex] = {
          direction: targetDir, // Flecha apunta a la dirección objetivo
          color: 'black', // Fondo negro
          arrowColor: 'blue' // Flecha azul
        };

        break;
    }

    setCircles(newCircles.map((circle) => {
      let col, row, xPos, yPos;
      const margen = numColumns > 1 ? (600 - (numColumns * circleSize)) / (numColumns - 1) : 0; // Espaciado entre círculos
      const offsetTopRows = 1; // Número de filas reservadas para el encabezado
      const minSpacing = circleSize * 1.2; // Espacio mínimo entre círculos
      const maxWidth = 600 - circleSize; // Límite derecho del área de juego
      const maxHeight = 550 - circleSize; // Límite inferior del área de juego

      let isOverlapping;

      do {
        isOverlapping = false; // Reiniciar estado de superposición

        if (stage === 4) {
          const biasFactor = Math.random() < 0.7 ? targetDir : directions[Math.floor(Math.random() * directions.length)];

          switch (biasFactor) {
            case '↑': // Favorecer la parte superior (pero no en la zona del encabezado)
              row = Math.floor(Math.random() * Math.ceil((numRows - offsetTopRows) * 0.4)) + offsetTopRows;
              col = Math.floor(Math.random() * numColumns);
              break;
            case '↓': // Favorecer la parte inferior
              row = Math.floor((numRows - offsetTopRows) * 0.6) + Math.floor(Math.random() * Math.ceil((numRows - offsetTopRows) * 0.4)) + offsetTopRows;
              col = Math.floor(Math.random() * numColumns);
              break;
            case '←': // Favorecer la izquierda
              col = Math.floor(Math.random() * Math.ceil(numColumns * 0.4));
              row = Math.floor(Math.random() * (numRows - offsetTopRows)) + offsetTopRows;
              break;
            case '→': // Favorecer la derecha
              col = Math.floor(numColumns * 0.6) + Math.floor(Math.random() * Math.ceil(numColumns * 0.4));
              row = Math.floor(Math.random() * (numRows - offsetTopRows)) + offsetTopRows;
              break;
            default: // Distribución normal
              col = Math.floor(Math.random() * numColumns);
              row = Math.floor(Math.random() * (numRows - offsetTopRows)) + offsetTopRows;
              break;
          }
        } else {
          col = Math.floor(Math.random() * numColumns);
          row = Math.floor(Math.random() * (numRows - offsetTopRows)) + offsetTopRows; // Evita la parte superior
        }

        // Calcular la posición en píxeles
        xPos = col * (circleSize + margen);
        yPos = row * (circleSize + margen);

        // 📌 Asegurar que los círculos no se salgan del área de juego
        xPos = Math.min(xPos, maxWidth);
        yPos = Math.min(yPos, maxHeight);

        // Verificar si esta posición está demasiado cerca de otro círculo
        isOverlapping = positions.some(pos => {
          const dx = pos.x - xPos;
          const dy = pos.y - yPos;
          return Math.sqrt(dx * dx + dy * dy) < minSpacing; // Verifica si la distancia es menor al mínimo permitido
        });

      } while (isOverlapping); // Si se solapan, repetir hasta encontrar una posición válida

      positions.push({ col, row, x: xPos, y: yPos }); // Guardar posición con coordenadas
      return { ...circle, x: xPos, y: yPos, color: "#1a1a1a" }; // Color inicial negro
    }));
    setStartTime(Date.now());
  };

  const handleInput = (direction) => {
    console.log(`El jugador presionó: ${direction}`);
    console.log(`Debes presionar la flecha: ${targetDirectionRef.current}`);

    let isCorrect = false;

    const endTime = Date.now();
    const reactionTime = endTime - startTime;
    setReactionTimes(prev => [...prev, reactionTime]);

    isCorrect = direction === targetDirectionRef.current;

    setTotalCards((prev) => prev + 1); // Aumentar total de intentos

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
      setScore((prev) => prev + 50);

      // Cambiar color a verde
      setCircles((prev) =>
        prev.map((circle) => ({ ...circle, color: "green" }))
      );

      setConsecutiveCorrect((prevConsecutive) => {
        const updatedConsecutive = prevConsecutive + 1;

        if (updatedConsecutive % 4 === 0) {
          const bonus = 100 + ((updatedConsecutive / 4 - 1) * 50);
          setScore((prev) => prev + bonus);
          setStars((prev) => prev + 1);

          setTimeout(() => {
            setStage((prev) => (prev < 5 ? prev + 1 : prev));
            generateCircles(); // Solo se llama si se sube de nivel
          }, 300);
        } else {
          setTimeout(() => {
            setRound((prev) => prev + 1);
            generateCircles(); // Solo se llama si NO se sube de nivel
          }, 300);
        }

        return updatedConsecutive;
      });
    } else {
      setTotalErrors((prev) => prev + 1);
      setScore((prev) => prev - 50);
      setConsecutiveCorrect(0);

      // Cambiar color a rojo
      setCircles((prev) =>
        prev.map((circle) => ({ ...circle, color: "red" }))
      );

      setTimeout(() => {
        setRound((prev) => prev + 1);
        generateCircles(); // Nueva ronda tras error
      }, 300);
    }
  };

  const calculateReactionTime = () => {
    console.log("Calculando tiempo de reacción...");

    if (!reactionTimes || reactionTimes.length === 0) {
      console.log("No hay tiempos de reacción registrados.");
      return 0;
    }

    // Filtrar valores no numéricos o inválidos
    const validTimes = reactionTimes.filter(time => typeof time === "number" && !isNaN(time));
    console.log("Tiempos válidos:", validTimes);

    if (validTimes.length === 0) {
      console.log("No hay tiempos de reacción válidos.");
      return 0;
    }

    const sum = validTimes.reduce((acc, time) => acc + time, 0);
    const average = parseFloat((sum / validTimes.length).toFixed(2));

    console.log(`Suma total: ${sum}, Cantidad: ${validTimes.length}, Promedio: ${average}`);

    return average;
  };

  return (
    <div className="concentrate-body relative w-full h-screen bg-gray-900 flex items-center justify-center">
      <div className="concentrate-game-container relative">
        {gameOver ? (
          <div className="concentrate-fin-juego-container">
            <h1>Fin del juego</h1>
            <p>🕒 Tiempo total de juego: {GAME_TIME} segundos</p>
            <p>🏅 <strong>Puntaje final:</strong> {score}</p>
            <p>✅ Correctas: {correctAnswers} de {totalCards}</p>
            <p>❌ Errores: {totalErrors}</p>
            <p>📊 Precisión: {totalCards > 0 ? ((correctAnswers / totalCards) * 100).toFixed(2) : "0"}%</p>
            <p>🕒 Tiempo de reacción: {(calculateReactionTime() / 1000).toFixed(2)} s</p>
            <button onClick={startCountdown}>
              Jugar de nuevo
            </button>
          </div>
        ) : !gameStarted ? (
          countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
            <div className="concentrate-start-screen">
              <h2>¡Bienvenido a Juego de atención!</h2>
              <button onClick={startCountdown}>Comenzar Juego</button>
            </div>
          ) : (
            <div className="concentrate-countdown">{countdown}</div>
          )
        ) : (
          <>
            <h2 className="concentrate-score">🎯 Puntaje: {score}</h2>
            <h3 className="concentrate-stars">📈 Nivel: {stage}</h3>
            <h3 className="concentrate-timer">⏳ Tiempo restante: {timer}s</h3>
            <div className="concentrate-grid">
              {circles.map((circle, index) => (
                <div
                  key={index}
                  className="concentrate-circle"
                  style={{
                    backgroundColor: circle.color, // Aplica el color dinámico
                    color: "#fff",
                    position: "absolute",
                    top: `${circle.y}px`,
                    left: `${circle.x}px`,
                    width: `${circleSize}px`,
                    height: `${circleSize}px`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 0.3s ease",
                  }}
                >
                  <span>{circle.direction}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConcentranteEnElObjetivo;