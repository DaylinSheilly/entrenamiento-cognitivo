import React, { useState, useEffect, useCallback, useRef } from 'react';
import './comparacion.css';

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
const COLOR_NAMES = {
    red: 'Rojo',
    blue: 'Azul',
    green: 'Verde',
    yellow: 'Amarillo',
    purple: 'Púrpura'
};
const NAMES_TO_COLOR = {
    'Rojo': 'red',
    'Azul': 'blue',
    'Verde': 'green',
    'Amarillo': 'yellow',
    'Púrpura': 'purple'
};

const MAX_LEVEL = 4;

const GAME_TIME = 45;

const CognitiveInhibitionGame = () => {
    const [gameState, setGameState] = useState({
        timeLeft: GAME_TIME,
        score: 50,
        level: 1,
        maxLevelReached: 1,  // Nuevo estado para almacenar el nivel máximo alcanzado
        stars: 0,
        correctCount: 0,
        totalErrors: 0,  // Nuevo estado para almacenar el total de errores
        totalCount: 0,
        consecutiveCorrect: 0,
        leftCard: { color: '', word: '' },
        rightCard: { color: '', word: '' },
        gameStarted: false,
        gameOver: false,
        feedbackColor: null,  // Nuevo estado para mostrar aciertos/errores
    });

    const [countdown, setCountdown] = useState(null);
    const [reactionTimes, setReactionTimes] = useState([]);
    const precision = gameState.totalCount > 0 ? ((gameState.correctCount / gameState.totalCount) * 100).toFixed(2) : '0.00';

    const [lastGeneratedColor, setLastGeneratedColor] = useState(null);
    const timerRef = useRef(null);

    const startCountdown = () => {
        if (timerRef.current) clearInterval(timerRef.current); // Limpiar cualquier temporizador previo
        setGameState(prevState => ({
            ...prevState,
            gameOver: false,
            gameStarted: false,
        }));
        setCountdown(3);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev === 1) {
                    clearInterval(timerRef.current);
                    setCountdown(null);
                    startGame(); // Iniciar el juego cuando llegue a 0
                }
                return prev - 1;
            });
        }, 1000);
    };

    const startGame = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        setGameState({
            timeLeft: 45,
            score: 50,
            level: 1,
            maxLevelReached: 1,
            stars: 0,
            correctCount: 0,
            totalErrors: 0,
            totalCount: 0,
            consecutiveCorrect: 0,
            leftCard: { color: '', word: '' },
            rightCard: { color: '', word: '' },
            ...generateCards(1),
            gameStarted: true,
            gameOver: false,
        });

        setCountdown(null);
        setReactionTimes([]);
        setLastGeneratedColor(null);
    };

    const getTextContrastColor = (bgColor) => {
        const lightColors = ['yellow']; // Colores donde el texto debe ser negro
        return lightColors.includes(bgColor) ? 'black' : 'white';
    };


    const generateRandomColor = useCallback((excludeColor = null) => {
        let color;
        do {
            color = COLORS[Math.floor(Math.random() * COLORS.length)];
        } while (color === excludeColor || color === lastGeneratedColor);

        setLastGeneratedColor(color);
        return color;
    }, [lastGeneratedColor]);

    const generateCards = useCallback((level) => {
        const shouldMatch = Math.random() < 0.5;
        const leftColor = generateRandomColor();
        let rightColor, rightWord, leftWord;

        switch (level) {
            case 1:
                // Los comparacion de las tarjetas coinciden
                leftWord = '';
                rightColor = shouldMatch ? leftColor : generateRandomColor();
                rightWord = '';
                break;

            case 2:
                // Palabra de la izquierda coincide con el color de la tarjeta de la derecha
                rightColor = generateRandomColor();
                leftWord = shouldMatch ? COLOR_NAMES[rightColor] : COLOR_NAMES[generateRandomColor()];
                rightWord = '';
                break;

            case 3:
                // Las palabras no coinciden con el color de sus tarjetas
                leftWord = !shouldMatch ? COLOR_NAMES[leftColor] : COLOR_NAMES[generateRandomColor()];
                rightColor = generateRandomColor();
                rightWord = !shouldMatch ? COLOR_NAMES[rightColor] : COLOR_NAMES[generateRandomColor()];
                break;

            case 4:
                // La palabra de la izquierda no coincide con el color de su tarjeta,
                // La palabra de la derecha coincide con el color de la tarjeta de la izquierda
                // El color de la tarjeta de las derecha no debe coincidir con la palabra de la derecha 
                leftWord = !shouldMatch ? COLOR_NAMES[leftColor] : COLOR_NAMES[generateRandomColor(leftColor)];
                rightWord = shouldMatch ? COLOR_NAMES[leftColor] : COLOR_NAMES[generateRandomColor()];
                rightColor = !shouldMatch ? NAMES_TO_COLOR[rightWord] : generateRandomColor(NAMES_TO_COLOR[rightWord]);
                break;

            default: break;
        }

        return { leftCard: { color: leftColor, word: leftWord }, rightCard: { color: rightColor, word: rightWord } };

    }, [generateRandomColor]);

    const reactionStartTime = useRef(0);
    let reactionEndTime = 0;

    useEffect(() => {
        if (!gameState.gameStarted) return;

        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                let isMatch = false;
                const reactionEndTime = Date.now();

                if (reactionStartTime.current === 0) {
                    // Evita el primer cálculo incorrecto
                    reactionStartTime.current = reactionEndTime;
                    return;
                }

                console.log("⏳ Tiempo inicial:", reactionStartTime.current);
                console.log("⏳ Tiempo actual:", reactionEndTime);

                switch (gameState.level) {
                    case 1:
                        // Nivel 1: Coincidencia exacta de colores.
                        isMatch = gameState.leftCard.color === gameState.rightCard.color;
                        break;

                    case 2:
                        // Nivel 2: La palabra en la izquierda debe coincidir con el color en la derecha.
                        isMatch = gameState.leftCard.word === COLOR_NAMES[gameState.rightCard.color];
                        break;

                    case 3:
                        // Nivel 3: Ni la palabra ni el color pueden coincidir entre ambas tarjetas.
                        isMatch = (gameState.leftCard.word !== COLOR_NAMES[gameState.leftCard.color]) &&
                            (gameState.rightCard.word !== COLOR_NAMES[gameState.rightCard.color]);
                        break;

                    case 4:
                        // Nivel 4: La palabra en la izquierda debe coincidir con el color de la derecha,
                        // pero la palabra de la derecha NO debe coincidir con su propio color.
                        isMatch = (gameState.leftCard.word === COLOR_NAMES[gameState.rightCard.color]) &&
                            (gameState.rightCard.word !== COLOR_NAMES[gameState.rightCard.color]);
                        break;

                    default:
                        isMatch = false;
                        break;
                }

                const correctKey = isMatch ? 'ArrowRight' : 'ArrowLeft';
                const playerCorrect = event.key === correctKey;

                const reactionTime = reactionEndTime - reactionStartTime.current;
                console.log("⏱ Tiempo de reacción calculado:", reactionTime);
                setReactionTimes(prevTimes => [...prevTimes, reactionTime]);

                setGameState(prev => {
                    const newConsecutiveCorrect = playerCorrect ? prev.consecutiveCorrect + 1 : 0;
                    const baseScore = playerCorrect ? 10 : -5;
                    let bonus = 0;
                    let starIncrement = 0;
                    let newLevel = prev.level;

                    if (playerCorrect && newConsecutiveCorrect % 4 === 0) {
                        bonus = 100 + ((newConsecutiveCorrect / 4 - 1) * 50);
                        starIncrement = 1;
                        if (prev.level < MAX_LEVEL) {
                            newLevel = prev.level + 1;
                        }
                    }

                    const newScore = prev.score + baseScore + bonus;
                    const newStars = prev.stars + starIncrement;

                    return {
                        ...prev,
                        score: newScore,
                        totalCount: prev.totalCount + 1,
                        correctCount: playerCorrect ? prev.correctCount + 1 : prev.correctCount,
                        totalErrors: !playerCorrect ? prev.totalErrors + 1 : prev.totalErrors,
                        consecutiveCorrect: newConsecutiveCorrect,
                        level: newLevel,
                        maxLevelReached: Math.max(prev.maxLevelReached, newLevel),
                        stars: newStars,
                        feedbackColor: playerCorrect ? "#4CAF50" : "#FF4C4C",
                        ...generateCards(newLevel), // 🔹 Genera nuevas tarjetas
                    };
                });
                reactionStartTime.current = Date.now();

                // Quitar el color de retroalimentación después de 500ms
                setTimeout(() => {
                    setGameState(prev => ({
                        ...prev,
                        feedbackColor: null
                    }));
                }, 500);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => { window.removeEventListener('keydown', handleKeyDown); };

    }, [gameState.gameStarted, gameState.leftCard, gameState.rightCard, gameState.level, generateCards]);

    useEffect(() => {
        if (!gameState.gameStarted) return;

        timerRef.current = setInterval(() => {
            setGameState(prev => {
                const newTimeLeft = prev.timeLeft - 1;

                if (newTimeLeft <= 0) {
                    clearInterval(timerRef.current);
                    return {
                        ...prev,
                        gameStarted: false,
                        gameOver: true,
                        timeLeft: 0,
                    };
                }

                return {
                    ...prev,
                    timeLeft: newTimeLeft,
                };
            });

        }, 1000);

        return () => clearInterval(timerRef.current);

    }, [gameState.gameStarted]);

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
        <div className="comparacion-game-container">
            {gameState.gameOver ? (
                <div className="comparacion-fin-juego-container">
                    <h1>Fin del juego</h1>
                    <p>🕒 Tiempo total de juego: {GAME_TIME} segundos</p>
                    <p>🏅 <strong>Puntaje final:</strong> {gameState.score}</p>
                    <p>🎯 <strong>Nivel máximo:</strong> {gameState.maxLevelReached}</p>
                    <p>✅ Correctas: {gameState.correctCount} de {gameState.totalCount}</p>
                    <p>❌ Errores: {gameState.totalErrors}</p>
                    <p>📊 Precisión: {precision}%</p>
                    <p>⭐ <strong>Estrellas obtenidas:</strong> {gameState.stars}</p>
                    <p>🕒 Tiempo de reacción: {(calculateReactionTime() / 1000).toFixed(2)} s</p>
                    <button onClick={startCountdown}>
                        Jugar de nuevo
                    </button>
                </div>
            ) : !gameState.gameStarted ? (
                countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
                    <div className="comparacion-start-screen">
                        <h2>¡Bienvenido a Comparación de colores!</h2>
                        <button onClick={startCountdown}>Comenzar Juego</button>
                    </div>
                ) : (
                    <div className="comparacion-countdown">{countdown}</div>
                )
            ) : (
                <div>
                    <div className="comparacion-game-app comparacion-justify-between mb-4" style={{ backgroundColor: gameState.feedbackColor || "#9ebde6" }}>
                        <div
                            className="comparacion-canvas-contenedor w-1/2 mr-2 p-4 text-center"
                            style={{
                                backgroundColor: gameState.leftCard.color,
                                color: getTextContrastColor(gameState.leftCard.color)
                            }}
                        >
                            {gameState.leftCard.word}
                        </div>

                        <div
                            className="comparacion-canvas-contenedor w-1/2 ml-2 p-4 text-center"
                            style={{
                                backgroundColor: gameState.rightCard.color,
                                color: getTextContrastColor(gameState.rightCard.color)
                            }}
                        >
                            {gameState.rightCard.word}
                        </div>
                    </div>

                    <div className="text-center text-gray-600"> ← Falso o Verdadero → </div>

                    {/* Marcadores y tiempo */}
                    <div className="comparacion-game-info">
                        <p>Nivel: {gameState.level}</p>
                        <p>Puntaje: {gameState.score}</p>
                        <p>Estrellas: {gameState.stars}</p>
                        <p>Errores: {gameState.totalErrors}</p>
                        <p>Tiempo: {gameState.timeLeft}s</p>
                    </div>

                </div>
            )}
        </div>
    );
};

export default CognitiveInhibitionGame;