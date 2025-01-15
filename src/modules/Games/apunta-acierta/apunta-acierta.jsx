import React, { useState, useEffect, useRef } from 'react';
import './apunta-acierta.css'; // Include styles for the game

const ApuntaYAcierta = () => {
    const [timeRemaining, setTimeRemaining] = useState(60);
    const [score, setScore] = useState(0);
    const [errors, setErrors] = useState(0);
    const [ballPosition, setBallPosition] = useState({ x: 0, y: 0 });
    const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 });
    const [ballSpeed, setBallSpeed] = useState(2);
    const [targetSize, setTargetSize] = useState(50);
    const [trajectory, setTrajectory] = useState('horizontal'); // 'horizontal' or 'vertical'
    const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'end'

    const gameAreaRef = useRef(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (gameState === 'playing') {
            const gameArea = gameAreaRef.current;
            if (gameArea) {
                // Centrando el objetivo, con un desplazamiento adicional
                const centerX = gameArea.offsetWidth / 2;
                const centerY = gameArea.offsetHeight / 2;
                setTargetPosition({ x: centerX + 9, y: centerY + 9 });
    
                // Ajustando la bola para que pase por el centro
                if (trajectory === 'horizontal') {
                    setBallPosition({ x: 0, y: centerY });
                    console.log('horizontal');
                } else {
                    setBallPosition({ x: centerX, y: 0 });
                    console.log('vertical');
                }
            }
        }
    }, [gameState, trajectory]);    

    useEffect(() => {
        if (gameState === 'playing') {
            const gameInterval = setInterval(() => {
                setBallPosition((prev) => {
                    const gameArea = gameAreaRef.current;
                    if (!gameArea) return prev;

                    if (trajectory === 'horizontal') {
                        const newX = prev.x + ballSpeed;
                        if (newX > gameArea.offsetWidth - 20) {
                            // Cambiar a trayectoria vertical
                            setTrajectory(Math.random() > 0.5 ? 'horizontal' : 'vertical');
                            return trajectory === 'horizontal'
                                ? { x: 0, y: targetPosition.y-9 }
                                : { x: targetPosition.x-9, y: 0 };
                        }
                        return { ...prev, x: newX };
                    } else {
                        const newY = prev.y + ballSpeed;
                        if (newY > gameArea.offsetHeight - 20) {
                            // Cambiar a trayectoria horizontal
                            setTrajectory(Math.random() > 0.5 ? 'horizontal' : 'vertical');
                            return trajectory === 'horizontal'
                                ? { x: 0, y: targetPosition.y-9 }
                                : { x: targetPosition.x-9, y: 0 };
                        }
                        return { ...prev, y: newY };
                    }
                });
            }, 16);

            intervalRef.current = gameInterval;
            return () => clearInterval(gameInterval);
        }
    }, [gameState, ballSpeed, trajectory, targetPosition]);

    useEffect(() => {
        if (gameState === 'playing') {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setGameState('end');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState]);

    const checkHit = () => {
        const ballCenter = {
            x: ballPosition.x + 10,
            y: ballPosition.y + 10,
        };
        const targetCenter = {
            x: targetPosition.x,
            y: targetPosition.y,
        };

        const distance = Math.sqrt(
            Math.pow(ballCenter.x - targetCenter.x, 2) +
            Math.pow(ballCenter.y - targetCenter.y, 2)
        );

        if (distance <= targetSize / 2) {
            setScore((prev) => prev + 10);
            setBallSpeed((prev) => prev + 0.5);
            setTargetSize((prev) => Math.max(prev - 2.5, 20));
        } else {
            setErrors((prev) => prev + 1);
        }
    };

    const startGame = () => {
        setGameState('playing');
        setTimeRemaining(60);
        setScore(0);
        setErrors(0);
        setBallSpeed(2);
        setTargetSize(50);
        setTrajectory('horizontal');
    };

    return (
        <div className="acierta-game-container">
            {gameState === 'start' && (
                <div className="acierta-start-screen">
                    <h1>Apunta y Acierta!</h1>
                    <button onClick={startGame}>Comenzar</button>
                </div>
            )}

            {gameState === 'playing' && (
                <div>
                    <div className="acierta-game-header">
                        <span>Tiempo: {timeRemaining}s</span>
                        <span>Puntaje: {score}</span>
                        <span>Errores: {errors}</span>
                    </div>

                    <div
                        className="acierta-game-area"
                        ref={gameAreaRef}
                        style={{ position: 'relative', width: '800px', height: '500px', background: '#34352f' }}
                    >
                        <div
                            className="acierta-ball"
                            style={{
                                position: 'absolute',
                                width: '20px',
                                height: '20px',
                                background: 'red',
                                borderRadius: '50%',
                                left: `${ballPosition.x}px`,
                                top: `${ballPosition.y}px`,
                            }}
                        ></div>

                        <div
                            className="acierta-target"
                            style={{
                                position: 'absolute',
                                width: `${targetSize}px`,
                                height: `${targetSize}px`,
                                background: 'blue',
                                borderRadius: '50%',
                                left: `${targetPosition.x - targetSize / 2}px`,
                                top: `${targetPosition.y - targetSize / 2}px`,
                            }}
                        ></div>
                    </div>

                    <button className="acierta-hit-button" onMouseDown={checkHit}>
                        Acierto!
                    </button>
                </div>
            )}

            {gameState === 'end' && (
                <div className="acierta-end-screen">
                    <h1>Resultados</h1>
                    <p>Puntaje Final: {score}</p>
                    <p>Errores Totales: {errors}</p>
                    <button onClick={startGame}>Jugar de Nuevo</button>
                </div>
            )}
        </div>
    );
};

export default ApuntaYAcierta;
