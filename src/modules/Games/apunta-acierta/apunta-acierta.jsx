import React, { useState, useEffect, useRef } from 'react';
import './apunta-acierta.css'; // Include styles for the game

const ApuntaYAcierta = () => {
    const [timeLeft, setTimeLeft] = useState(60);
    const [score, setScore] = useState(50);
    const [errors, setErrors] = useState(0);
    const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
    const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
    const [ballSpeed, setBallSpeed] = useState(2);
    const [targetSize, setTargetSize] = useState(50);
    const [trajectory, setTrajectory] = useState('horizontal'); // 'horizontal' or 'vertical'
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [errorTimestamps, setErrorTimestamps] = useState([]);
    const [hitTimestamps, setHitTimestamps] = useState([]);
    const [stars, setStars] = useState(0);
    const [totalAnswers, setTotalAnswers] = useState(0);
    const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [reactionTime, setReactionTime] = useState(0);
    const [targetColor, setTargetColor] = useState('blue');

    const gameAreaRef = useRef(null);
    const intervalRef = useRef(null);

    // Manejo del temporizador
    useEffect(() => {
        if (gameStarted && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else if (gameStarted && timeLeft === 0) {
            setGameStarted(false);
            setGameOver(true);
        }
    }, [timeLeft, gameStarted]);

    useEffect(() => {
        if (gameStarted) {
            const gameArea = gameAreaRef.current;
            if (gameArea) {
                // Centrando el objetivo, con un desplazamiento adicional
                const centerX = gameArea.offsetWidth / 2;
                const centerY = gameArea.offsetHeight / 2;
                setTargetPosition({ x: centerX + 9, y: centerY + 9 });

                // Ajustando la bola para que pase por el centro
                setBallPosition(
                    trajectory === 'horizontal'
                        ? { x: -20, y: centerY }
                        : { x: centerX, y: -20 }
                );
            }
        }
    }, [gameStarted, trajectory]);

    useEffect(() => {
        if (!gameStarted) return;

        const gameInterval = setInterval(() => {
            setBallPosition((prev) => {
                const gameArea = gameAreaRef.current;
                if (!gameArea) return prev;

                const gameAreaWidth = gameArea.offsetWidth;
                const gameAreaHeight = gameArea.offsetHeight;

                if (trajectory === 'horizontal') {
                    const newX = prev.x + ballSpeed;
                    if (newX > gameAreaWidth + 20) {
                        const newTrajectory = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                        setTrajectory(newTrajectory);
                        return newTrajectory === 'horizontal'
                            ? { x: -20, y: prev.y }
                            : { x: targetPosition.x - 9, y: -20 };
                    }
                    return { ...prev, x: newX };
                } else {
                    const newY = prev.y + ballSpeed;
                    if (newY > gameAreaHeight + 20) {
                        const newTrajectory = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                        setTrajectory(newTrajectory);
                        return newTrajectory === 'horizontal'
                            ? { x: -20, y: targetPosition.y - 9 }
                            : { x: targetPosition.x - 9, y: -20 };
                    }
                    return { ...prev, y: newY };
                }
            });
        }, 16);

        intervalRef.current = gameInterval;
        return () => clearInterval(gameInterval);
    }, [gameStarted, ballSpeed, trajectory, targetPosition]);

    useEffect(() => {
        if (gameStarted) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setGameStarted(false);
                        setGameOver(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameStarted]);

    const startGame = () => {
        setGameStarted(true);
        setGameOver(false);
        setTimeLeft(60);
        setScore(50);
        setErrors(0);
        setBallPosition({ x: 0, y: 0 });
        setTargetPosition({ x: 0, y: 0 });
        setBallSpeed(2);
        setTargetSize(50);
        setTrajectory('horizontal');
        setCorrectAnswers(0);
        setErrorTimestamps([]);
        setHitTimestamps([]);
        setStars(0);
        setTotalAnswers(0);
        setConsecutiveCorrect(0);
        setCountdown(null);
        setReactionTime(0);
        setTargetColor('blue');
    };

    const startCountdown = () => {
        setGameOver(false); // Asegurar que se oculta la pantalla de fin de juego
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

    const checkHit = () => {
        setTotalAnswers((prev) => prev + 1);

        const getCenter = (pos) => ({ x: pos.x + 10, y: pos.y + 10 });

        const ballCenter = getCenter(ballPosition);
        const targetCenter = getCenter(targetPosition);

        const distance = Math.hypot(
            ballCenter.x - targetCenter.x,
            ballCenter.y - targetCenter.y
        );

        const isHit = distance <= targetSize / 2;

        if (isHit) {
            const newConsecutive = consecutiveCorrect + 1;
            setConsecutiveCorrect(newConsecutive);
            let scoreIncrease = 50; // Suma de puntos base

            if (newConsecutive % 4 === 0) {
                const bonus = 100 + ((newConsecutive / 4 - 1) * 50);
                scoreIncrease += bonus;
                setStars((prev) => prev + 1);
            }
            setScore((prev) => prev + scoreIncrease);
            setBallSpeed((prev) => prev + 0.5);
            setTargetSize((prev) => Math.max(prev - 2.5, 20));
            setCorrectAnswers((prev) => prev + 1);
            setHitTimestamps((prev) => [...prev, Date.now()]);
            setTargetColor('green');
        } else {
            setErrors((prev) => prev + 1);
            setErrorTimestamps((prev) => [...prev, Date.now()]);
            setTargetColor('red');
        }

        // Restablecer el color de forma más eficiente
        setTimeout(() => setTargetColor('blue'), 500);
    };

    const calculateRecoveryTime = () => {
        if (errorTimestamps.length === 0 || hitTimestamps.length === 0) return 'N/A';
        let totalRecoveryTime = 0;
        let count = 0;

        errorTimestamps.forEach(errorTime => {
            const nextHit = hitTimestamps.find(hitTime => hitTime > errorTime);
            if (nextHit) {
                totalRecoveryTime += (nextHit - errorTime) / 1000;
                count++;
            }
        });
        return count > 0 ? (totalRecoveryTime / count).toFixed(2) + 's' : 'N/A';
    };

    return (
        <div className="acierta-game-container">
            {gameOver ? (
                <div className="acierta-fin-juego-container">
                    <h1>Fin del juego</h1>
                    <p>🎯 Puntaje final: {score}</p>
                    <p>✅ Correctas: {correctAnswers} de {totalAnswers}</p>
                    <p>📊 Precisión: {totalAnswers > 0 ? ((correctAnswers / totalAnswers) * 100).toFixed(2) : "0"}%</p>
                    <p>⭐ Estrellas: {stars}</p>
                    <p>🕒 Tiempo de reacción promedio: {reactionTime.toFixed(2)}s</p> 
                    <p>🕒 Tiempo de recuperación: {calculateRecoveryTime()}</p>
                    <button onClick={startCountdown}>
                        Jugar de nuevo
                    </button>
                </div>
            ) : !gameStarted ? (
                countdown === null ? ( // Mostrar pantalla de inicio si NO hay cuenta regresiva
                    <div className="acierta-start-screen">
                        <h2>¡Bienvenido a Apunta y acierta!</h2>
                        <button onClick={startCountdown}>Comenzar Juego</button>
                    </div>
                ) : (
                    <div className="acierta-countdown">{countdown}</div>
                )
            ) : (
                <div>
                    <div className="acierta-game-info">
                        <p>Tiempo: {timeLeft}s</p>
                        <p>Puntaje: {score}</p>
                        <p>Errores: {errors}</p>
                    </div>

                    <div
                        className="acierta-game-area"
                        ref={gameAreaRef}
                    >
                        <div
                            className="acierta-ball"
                            style={{
                                left: `${ballPosition.x}px`,
                                top: `${ballPosition.y}px`,
                            }}
                        ></div>

                        <div
                            className="acierta-target"
                            style={{
                                width: `${targetSize}px`,
                                height: `${targetSize}px`,
                                background: targetColor, // Color dinámico según el estado
                                borderRadius: '50%',
                                left: `${targetPosition.x - targetSize / 2}px`,
                                top: `${targetPosition.y - targetSize / 2}px`,
                                transition: 'background 0.3s ease',
                            }}
                        ></div>
                    </div>
                    <button className="acierta-hit-button" onMouseDown={checkHit}>
                        Acierto
                    </button>
                </div>
            )}
        </div>
    );
};

export default ApuntaYAcierta;
