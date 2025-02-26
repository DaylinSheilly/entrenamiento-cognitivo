import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Star } from 'lucide-react';
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

const CognitiveInhibitionGame = () => {
    const [gameState, setGameState] = useState({
        timeLeft: 45,
        score: 50,
        level: 1,
        maxLevelReached: 1,  // Nuevo estado para almacenar el nivel máximo alcanzado
        stars: 0,
        correctCount: 0,
        totalCount: 0,
        consecutiveCorrect: 0,
        leftCard: { color: '', word: '' },
        rightCard: { color: '', word: '' },
        gameStarted: false,
        gameOver: false,
    });

    const [lastGeneratedColor, setLastGeneratedColor] = useState(null);
    const timerRef = useRef(null);

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
                // Los colores de las tarjetas coinciden
                leftWord = '';
                rightColor = shouldMatch ? leftColor : generateRandomColor();
                rightWord = '';
                break;

            case 2:
                // Palabra de la derecha coincide con el color de la tarjeta de la izquierda
                leftWord = '';
                rightColor = generateRandomColor();
                rightWord = shouldMatch ? COLOR_NAMES[leftColor] : COLOR_NAMES[generateRandomColor()];
                break;

            case 3:
                // Las palabras no coinciden con el color de sus tarjetas
                leftWord = !shouldMatch ? COLOR_NAMES[leftColor] : COLOR_NAMES[generateRandomColor(leftColor)];
                rightColor = generateRandomColor();
                rightWord = !shouldMatch ? COLOR_NAMES[rightColor] : COLOR_NAMES[generateRandomColor(rightColor)];
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

    const startGame = () => {
        if (timerRef.current) clearInterval(timerRef.current);

        setGameState({ timeLeft: 45, score: 50, level: 1, maxLevelReached: 1, stars: 0, correctCount: 0, totalCount: 0, consecutiveCorrect: 0, ...generateCards(1), gameStarted: true, gameOver: false });
    };

    useEffect(() => {
        if (!gameState.gameStarted) return;

        const handleKeyDown = (event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                let isMatch = false;

                switch (gameState.level) {
                    case 1:
                        // Los colores de las tarjetas coinciden
                        isMatch = COLOR_NAMES[gameState.leftCard.color] === COLOR_NAMES[gameState.rightCard.color];
                        break;

                    case 2:
                        // Palabra de la derecha coincide con el color de la tarjeta de la izquierda
                        isMatch = gameState.rightCard.word === COLOR_NAMES[gameState.leftCard.color];
                        break;

                    case 3:
                        // Las palabras no coinciden con el color de sus tarjetas
                        isMatch = (gameState.leftCard.word !== COLOR_NAMES[gameState.leftCard.color]) &&
                            (gameState.rightCard.word !== COLOR_NAMES[gameState.rightCard.color]);
                        break;

                    case 4:
                        // La palabra de la izquierda es de otro color al de su tarjeta,
                        // la palabra de la derecha coincide con el color de la tarjeta de la izquierda pero el color de su tarjeta es distinto
                        isMatch = (gameState.leftCard.word !== COLOR_NAMES[gameState.leftCard.color]) &&
                            (gameState.rightCard.word === COLOR_NAMES[gameState.leftCard.color]) &&
                            (COLOR_NAMES[gameState.rightCard.color] !== gameState.rightCard.word);
                        break;

                    default:
                        break;
                }

                const correctKey = isMatch ? 'ArrowRight' : 'ArrowLeft';
                const playerCorrect = event.key === correctKey;

                console.log(playerCorrect);

                setGameState(prev => {
                    // Actualiza la racha de aciertos
                    const newConsecutiveCorrect = playerCorrect ? prev.consecutiveCorrect + 1 : 0;

                    // Puntos básicos: +10 si acierta, -5 si falla
                    const baseScore = playerCorrect ? 10 : -5;

                    // Variables para bono, incremento de estrella y nuevo nivel
                    let bonus = 0;
                    let starIncrement = 0;
                    let newLevel = prev.level;

                    // Si la respuesta es correcta y se completa un bloque de 4 aciertos consecutivos:
                    if (playerCorrect && newConsecutiveCorrect % 4 === 0) {
                        // Calcula el bono: 100 para el primer bloque, 150 para el segundo, etc.
                        bonus = 100 + ((newConsecutiveCorrect / 4 - 1) * 50);
                        // Suma una estrella por cada bloque completado
                        starIncrement = 1;
                        // Si aún no se alcanza el nivel máximo, se incrementa el nivel
                        if (prev.level < MAX_LEVEL) {
                            newLevel = prev.level + 1;
                        }
                    }

                    const newScore = prev.score + baseScore + bonus;
                    const newStars = prev.stars + starIncrement;

                    return {
                        ...prev,
                        score: newScore,
                        correctCount: playerCorrect ? prev.correctCount + 1 : prev.correctCount,
                        totalCount: prev.totalCount + 1,
                        consecutiveCorrect: newConsecutiveCorrect,
                        level: newLevel,
                        stars: newStars,
                        ...generateCards(newLevel),
                    };
                });
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

    const precision = gameState.totalCount > 0 ? ((gameState.correctCount / gameState.totalCount) * 100).toFixed(2) : '0.00';

    return (
        <div class="comparacion-body">
            <div className="comparacion-juego-contenedor">
                <h1 className="text-2xl font-bold mb-4">Comparación de colores</h1>

                {!gameState.gameStarted && !gameState.gameOver && (
                    <div className="comparacion-instrucciones-contenedor">
                        <h2 className="text-lg font-semibold mb-2">Objetivo del Juego</h2>
                        <p className="mb-4"> Decide rápidamente si el significado de la palabra en la tarjeta izquierda coincide con el color de la tarjeta derecha:</p>

                        <ul className="list-disc pl-6 mb-4">
                            <li>Flecha derecha si el significado corresponde.</li>
                            <li>Flecha izquierda si no corresponde.</li>
                        </ul>

                        <h3 className="text-md font-semibold mb-2">Niveles de Dificultad</h3>
                        <p className="mb-2">Cada nivel aumenta la dificultad de la correspondencia:</p>

                        <ul className="list-disc pl-6 mb-4">
                            <li>Nivel 1: Colores sin palabras.</li>
                            <li>Nivel 2: Palabra en izquierda, color en derecha.</li>
                            <li>Nivel 3: Palabras sin coincidencia de significado y color.</li>
                            <li>Nivel 4: Combinación compleja de palabra y color.</li>
                        </ul>

                        <h3 className="text-md font-semibold mb-2">Sistema de Puntaje</h3>

                        <ul className="list-disc pl-6 mb-4">
                            <li>Inicias con 50 puntos.</li>
                            <li>+10 puntos por acierto, -5 por error.</li>
                            <li>Bono de 100 puntos por cuatro aciertos consecutivos.</li>
                        </ul>

                        <button onClick={startGame} className="comparacion-button w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"> Comenzar Juego </button>
                    </div>
                )}

                {gameState.gameStarted && (
                    <div>
                        <div className="comparacion-flex comparacion-justify-between mb-4">
                            <div className="comparacion-canvas-contenedor w-1/2 mr-2 p-4 text-center" style={{ backgroundColor: gameState.leftCard.color }}>
                                {gameState.leftCard.word}
                            </div>

                            <div className="comparacion-canvas-contenedor w-1/2 ml-2 p-4 text-center" style={{ backgroundColor: gameState.rightCard.color }}>
                                {gameState.rightCard.word}
                            </div>
                        </div>

                        <div className="text-center text-gray-600"> ← Falso o Verdadero → </div>

                        {/* Marcadores y tiempo */}
                        <div className="comparacion-marcadores">
                            <div className="comparacion-marcador-item">
                                <div>
                                    <Clock className="mr-2" /> {gameState.timeLeft}s
                                </div>
                                <div>
                                    <Star className="mr-2" /> {gameState.stars}
                                </div>
                                <div className="text-center font-bold text-lg">
                                    Puntaje: {gameState.score}
                                </div>
                                <div className="text-center font-bold text-lg">
                                    Nivel actual: {gameState.level}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {gameState.gameOver && (
                    <div className="comparacion-fin-juego">
                        <h2 className="text-xl font-bold mb-4">Juego Terminado</h2>

                        {/* Resultados finales */}
                        <div>
                            <p>Puntaje Final: {gameState.score}</p>
                            <p>Nivel máximo alcanzado: {gameState.maxLevelReached}</p>
                            <p>Estrellas: {gameState.stars}</p>
                            <p>Tarjetas Correctas: {gameState.correctCount} de {gameState.totalCount}</p>
                            <p>Precisión: {precision}%</p>

                            {/* Botón para reiniciar juego */}
                            <button onClick={startGame} className="comparacion-button mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"> Jugar de Nuevo </button>

                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CognitiveInhibitionGame;