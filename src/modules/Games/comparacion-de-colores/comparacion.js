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

const MAX_LEVEL = 4; 

const CognitiveInhibitionGame = () => { 
    const [gameState, setGameState] = useState({ 
        timeLeft: 45, 
        score: 50, 
        level: 1, 
        stars: 1, 
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
        const leftColor = generateRandomColor(); 
        const shouldMatch = Math.random() < 0.5; 
        
        let leftWord = COLOR_NAMES[leftColor]; 
        let rightColor, rightWord; 
        
        switch (level) { 
            case 1: 
                rightColor = shouldMatch ? leftColor : generateRandomColor(leftColor); 
                leftWord = ''; 
                rightWord = ''; 
                break; 

            case 2: 
                leftWord = COLOR_NAMES[generateRandomColor(leftColor)]; 
                rightColor = shouldMatch ? leftColor : generateRandomColor(leftColor); 
                rightWord = ''; 
                break; 

            case 3: 
                leftWord = COLOR_NAMES[generateRandomColor(leftColor)]; 
                rightColor = generateRandomColor(); 
                rightWord = shouldMatch ? leftWord : COLOR_NAMES[generateRandomColor(rightColor)]; 
                break; 

            case 4: 
                leftWord = COLOR_NAMES[generateRandomColor(leftColor)]; 
                rightColor = shouldMatch ? leftColor : generateRandomColor(leftColor); 
                rightWord = ''; 
                break; 

            default: break; 
        } 
        
        return { leftCard: { color: leftColor, word: leftWord }, rightCard: { color: rightColor, word: rightWord } }; 
        
    }, [generateRandomColor]); 

    const startGame = () => { 
        if (timerRef.current) clearInterval(timerRef.current); 
        
        setGameState({ timeLeft: 45, score: 50, level: 1, stars: 1, correctCount: 0, totalCount: 0, consecutiveCorrect: 0, ...generateCards(1), gameStarted: true, gameOver: false }); 
    }; 

    useEffect(() => {  
        if (!gameState.gameStarted) return; 
        
        const handleKeyDown = (event) => {  
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {  
                let isMatch = false;  
                
                switch (gameState.level) {  
                    case 1:
                        isMatch = gameState.leftCard.color === gameState.rightCard.color;  
                        break;  
                    case 2:
                    case 3:
                        isMatch = gameState.leftCard.word === gameState.rightCard.color;  
                        break;  
                    case 4:
                        isMatch = gameState.leftCard.word === gameState.rightCard.color;  
                        break;  
                    default:
                        break;  
                }  

                const correctKey = isMatch ? 'ArrowRight' : 'ArrowLeft';  
                const playerCorrect = event.key === correctKey;  

                setGameState(prev => {  
                    const newConsecutiveCorrect = playerCorrect ? prev.consecutiveCorrect + 1 : 0;  
                    const shouldLevelUp = playerCorrect && newConsecutiveCorrect >= 4 && prev.level < MAX_LEVEL;  
                    const newLevel = shouldLevelUp ? prev.level + 1 : prev.level;  
                    const newStars = shouldLevelUp ? prev.stars + 1 : prev.stars;  

                    return {  
                        ...prev,
                        score: playerCorrect ? prev.score + 10 : prev.score - 5,
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

                    <div className="text-center text-gray-600"> Usa ← Izquierda o → Derecha </div>
                    
                    {/* Marcadores y tiempo */}
                    <div className="comparacion-marcadores">
                        <div className="comparacion-marcador-item">
                            Tiempo Restante: {gameState.timeLeft}s
                            <Clock className="mr-2" />
                            Estrellas:
                            <Star className="mr-2" />
                            Puntaje:
                            {gameState.score}
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
                        <p>Nivel Alcanzado: {gameState.level}</p>
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