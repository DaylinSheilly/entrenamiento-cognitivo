import React, { useState, useEffect, useRef } from 'react';
import "./no-pierdas-objetos.css";

const emojis = ["🚗", "⭐", "🍎", "⚽", "📖", "✏️", "🌸", "🐕", "☁️", "👟", "🍏", "⚾", "🖊️", "🌺", "🐩", "🧢"];

// Definición de los niveles
const niveles = [
    { objetivos: 1, distractores: 3, movimiento: 100, dimension: 330, previsualizacion: 2000, movimientoTiempo: 7000 },
    { objetivos: 1, distractores: 5, movimiento: 150, dimension: 340, previsualizacion: 2000, movimientoTiempo: 6000 },
    { objetivos: 2, distractores: 7, movimiento: 200, dimension: 350, previsualizacion: 1500, movimientoTiempo: 5500 },
    { objetivos: 2, distractores: 10, movimiento: 250, dimension: 355, previsualizacion: 1500, movimientoTiempo: 5000 },
    { objetivos: 3, distractores: 12, movimiento: 300, dimension: 360, previsualizacion: 1000, movimientoTiempo: 4500 },
    { objetivos: 3, distractores: 15, movimiento: 350, dimension: 365, previsualizacion: 1000, movimientoTiempo: 4000 },
    { objetivos: 4, distractores: 18, movimiento: 400, dimension: 370, previsualizacion: 750, movimientoTiempo: 3500 },
    { objetivos: 4, distractores: 20, movimiento: 450, dimension: 375, previsualizacion: 700, movimientoTiempo: 3000 },
];


const NoPierdasLosObjetos = ({ onGameEnd }) => {
    const [nivel, setNivel] = useState(1);
    const [tiempoTotal, setTiempoTotal] = useState(120); // Tiempo total del juego
    const [objetos, setObjetos] = useState([]);
    const [fondoEstado, setFondoEstado] = useState(""); // Controla el color del fondo
    const [gameOver, setgameOver] = useState(false);
    const [movimientoActivo, setMovimientoActivo] = useState(false);
    const [puntaje, setPuntaje] = useState(50); // Inicia con 50 puntos
    const [rachaAciertos, setRachaAciertos] = useState(0); // Contador de aciertos consecutivos
    const [estrellas, setEstrellas] = useState(0); // Contador de estrellas ganadas
    const [totalAnswers, setTotalAnswers] = useState(0);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [errorAnswers, setErrorAnswers] = useState(0);
    const [tiempoRestante, setTiempoRestante] = useState(120); // segundos
    const timeoutRef = useRef(null);
    const [objetivosSeleccionados, setObjetivosSeleccionados] = useState([]);
    const [gameStarted, setGameStarted] = useState(false);
    const [countdown, setCountdown] = useState(null);
    const [fastAnswers, setFastAnswers] = useState(0);
    const readyToClickTimeRef = useRef(null);
    const isHandlingGameEnd = useRef(false);

    // FUNCIONES DE REGISTRO DE ESTADISTICAS -------------------------------------------- //

    const gameData = {
        game_name: "No pierdas los objetos",
        level: nivel-1, // nivel ya empieza en 1
        difficulty: nivel <= 3 ? "fácil" :
            nivel <= 6 ? "medio" : "difícil",
        actions_taken: totalAnswers,
        accuracy: totalAnswers > 0 ?
            Number(((correctAnswers / totalAnswers) * 100).toFixed(2)) : 0,
        streaks: rachaAciertos,
        errors: errorAnswers,
        score: puntaje,
    };

    const handleGameEnd = () => {
        // Envía los datos al GameLayout
        // console.log("Datos del juego:", gameData);
        onGameEnd(gameData);
    };

    useEffect(() => {
        if (gameOver && !isHandlingGameEnd.current) {
            isHandlingGameEnd.current = true;
            handleGameEnd();
            isHandlingGameEnd.current = false;
        }
    }, [gameOver]);

    // Timer: cuenta regresiva de 45 segundos
    useEffect(() => {
        if (gameStarted && tiempoRestante > 0) {
            const timer = setTimeout(() => {
                setTiempoRestante(prevTiempo => prevTiempo - 1);
            }, 1000);

            return () => clearTimeout(timer);
        }
        else if (tiempoRestante === 0 && gameStarted) {
            // ⏳ Espera 10 segundos adicionales antes de finalizar el juego
            if (!timeoutRef.current) {
                timeoutRef.current = setTimeout(() => {
                    finalizarJuego();
                    timeoutRef.current = null; // Resetear la referencia después de ejecutar
                }, 10000);
            }
        }
        return () => clearTimeout(timeoutRef.current); // Limpieza segura del timeout
    }, [tiempoRestante, gameStarted]);

    const iniciarNivel = (nivelActual) => {
        const config = niveles[nivelActual - 1];
        setMovimientoActivo(true); // Bloquear clics
        setFondoEstado("espera"); // Activar fondo amarillo
        mostrarObjetivos(config);
        setTimeout(() => {

            agregarDistractores(config);
            moverObjetos(config);
        }, config.previsualizacion);
    };

    const startGame = () => {
        setNivel(1);
        setObjetos([]);
        setFondoEstado(""); // Restaurar fondo a estado normal
        setgameOver(false);
        setMovimientoActivo(false);
        setPuntaje(50); // Iniciar con 50 puntos
        setRachaAciertos(0); // Reiniciar racha de aciertos consecutivos
        setEstrellas(0); // Reiniciar contador de estrellas
        setTotalAnswers(0);
        setCorrectAnswers(0);
        setErrorAnswers(0);
        setTiempoRestante(120); // Restaurar tiempo a 120 segundos
        setObjetivosSeleccionados([]);
        setGameStarted(true);
        setCountdown(null);
        setFastAnswers(0);

        iniciarNivel(1); // Reiniciar en el nivel 1
    };

    const startCountdown = () => {
        setgameOver(false);
        setCountdown(3); // Inicia en 3 segundos

        let countdownValue = 3; // Variable local para manejar el estado correctamente

        const interval = setInterval(() => {
            countdownValue -= 1;

            setCountdown(countdownValue);

            if (countdownValue === 0) {
                clearInterval(interval);
                setCountdown(null);
                startGame(); // Iniciar el juego cuando llega a 0
            }
        }, 1000);
    };

    const mostrarObjetivos = (config) => {
        const nuevosObjetos = generarObjetos(config.objetivos, true, config.dimension);
        setObjetos(nuevosObjetos);
    };

    const agregarDistractores = (config) => {
        const distractores = generarObjetos(config.distractores, false, config.dimension);
        setObjetos(prevObjetos => [...prevObjetos, ...distractores]);
    };

    const generarObjetos = (cantidad, esObjetivo, dimension) => {
        return Array.from({ length: cantidad }, (_, index) => ({
            id: `${esObjetivo ? 'obj' : 'dist'}-${index}`,
            emoji: emojis[Math.floor(Math.random() * emojis.length)], // Selección aleatoria para ambos
            esObjetivo,
            posicion: {
                top: `${Math.random() * (dimension - 50)}px`,
                left: `${Math.random() * (dimension - 50)}px`
            }
        }));
    };

    const moverObjetos = (config) => {
        const espacioMinimo = 45; // Distancia mínima entre objetos

        // Agregar clase de animación a todos los objetos antes de iniciar el movimiento
        setObjetos(prevObjetos =>
            prevObjetos.map(obj => ({
                ...obj,
                animado: true
            }))
        );

        const intervalo = setInterval(() => {
            setObjetos(prevObjetos => {
                let nuevasPosiciones = prevObjetos.map(obj => ({
                    top: parseFloat(obj.posicion.top),
                    left: parseFloat(obj.posicion.left)
                }));

                return prevObjetos.map((obj, index) => {
                    let nuevaPos;
                    let intentos = 0;
                    do {
                        const nuevoTop = Math.max(
                            0,
                            Math.min(config.dimension - 50,
                                parseFloat(obj.posicion.top) + (Math.random() * config.movimiento - config.movimiento / 2)
                            )
                        );
                        const nuevoLeft = Math.max(
                            0,
                            Math.min(config.dimension - 50,
                                parseFloat(obj.posicion.left) + (Math.random() * config.movimiento - config.movimiento / 2)
                            )
                        );

                        nuevaPos = { top: nuevoTop, left: nuevoLeft };

                        // Validar si la nueva posición colisiona con otra
                        const colisiona = nuevasPosiciones.some((pos, i) =>
                            i !== index && Math.abs(pos.top - nuevoTop) < espacioMinimo && Math.abs(pos.left - nuevoLeft) < espacioMinimo
                        );

                        if (!colisiona) {
                            nuevasPosiciones[index] = nuevaPos;
                            break;
                        }

                        intentos++;
                    } while (intentos < 10); // Evita bucles infinitos en espacios reducidos

                    return {
                        ...obj,
                        posicion: {
                            top: `${nuevaPos.top}px`,
                            left: `${nuevaPos.left}px`
                        }
                    };
                });
            });
        }, 500);

        setTimeout(() => {
            clearInterval(intervalo);
            setMovimientoActivo(false); // Permitir clics nuevamente
            setFondoEstado(""); // Restaurar fondo normal
            readyToClickTimeRef.current = Date.now();
        }, config.movimientoTiempo);
    };

    const manejarClick = (id, esObjetivo) => {
        if (movimientoActivo) return; // Bloquear interacciones si los objetos están en movimiento

        if (esObjetivo) {
            if (!objetivosSeleccionados.includes(id)) {
                setObjetivosSeleccionados(prev => {
                    const nuevosSeleccionados = [...prev, id];
                    // Si se han seleccionado todos los objetivos, avanzar nivel
                    if (nuevosSeleccionados.length === niveles[nivel - 1].objetivos) {
                        const now = Date.now();
                        if (readyToClickTimeRef.current && now - readyToClickTimeRef.current <= 1000) {
                            setFastAnswers(prev => prev + 1);
                        }
                        setFondoEstado("exito"); // Activar fondo verde
                        setPuntaje(prev => prev + 50);
                        setTimeout(() => {
                            avanzarNivel(); // Pasar al siguiente nivel
                            //setFondoEstado(""); // Restaurar fondo normal
                        }, 500);
                        // ✅ Acierto: sumar 50 puntos y aumentar la racha
                        setRachaAciertos(prev => {
                            const nuevaRacha = prev + 1;
                            // 🎉 Cada 4 aciertos consecutivos, se otorga un bonus y una estrella
                            if (nuevaRacha % 4 === 0) {
                                const bonus = 100 + ((nuevaRacha / 4 - 1) * 50);
                                setPuntaje(prev => prev + bonus);
                                setEstrellas(prev => prev + 1);
                            }
                            return nuevaRacha;
                        });
                        // 🛑 Si el tiempo ya está en 0, finalizar el juego después de este intento
                        if (tiempoRestante <= 0) {
                            clearTimeout(timeoutRef.current);
                            setTimeout(finalizarJuego, 500);
                        }
                    }
                    return nuevosSeleccionados;
                });
            }
        } else {
            // ❌ Error: reiniciar la racha y el nivel
            setFondoEstado("error"); // Activar fondo rojo
            setRachaAciertos(0); // Reiniciar la racha, pero las estrellas se conservan
            setTimeout(() => {
                reiniciarNivel(); // Reiniciar nivel
                setFondoEstado(""); // Restaurar fondo normal
                // 🛑 Si el tiempo ya está en 0, finalizar el juego después del error
                if (tiempoRestante <= 0) {
                    clearTimeout(timeoutRef.current);
                    finalizarJuego();
                }
            }, 500);
        }
    };

    const reiniciarNivel = () => {
        setErrorAnswers(errorAnswers + 1);
        setTotalAnswers(totalAnswers + 1);
        setObjetivosSeleccionados([]); // Resetear objetivos seleccionados
        iniciarNivel(nivel); // Volver a iniciar el nivel actual
    };

    const avanzarNivel = () => {
        setTotalAnswers(totalAnswers + 1);
        setObjetivosSeleccionados([]); // Limpiar seleccionados al avanzar
        if (nivel < 8) {
            setNivel(nivel + 1);
            setCorrectAnswers(correctAnswers + 1);
        } else {
            finalizarJuego();
        }
        iniciarNivel(nivel + 1);
    };

    const finalizarJuego = () => {
        setgameOver(true);
        setGameStarted(false);
    };

    return (
        <div className="no-pierdas-game-container">
            {gameOver ? (
                <div className="no-pierdas-fin-juego-container">
                    <h1>Fin del juego</h1>
                    <div className="no-pierdas-stats-table-wrapper">
                        <table className="no-pierdas-stats-table">
                            <thead>
                                <tr>
                                    <th>⏱️ Tiempo total</th>
                                    <th>🎯 Puntaje final</th>
                                    <th>🏆 Nivel máximo</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <span>{tiempoTotal}</span>
                                    </td>
                                    <td>
                                        <span>{puntaje}</span>
                                    </td>
                                    <td>
                                        <span>{nivel}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>✅ {correctAnswers} aciertos</span>
                                    </td>
                                    <td>
                                        <span>❌ {errorAnswers} errores</span>
                                    </td>
                                    <td>
                                        <span>
                                            📊 Precisión:{" "}
                                            {totalAnswers > 0
                                                ? `${((correctAnswers / totalAnswers) * 100).toFixed(2)}%`
                                                : "0%"}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <span>⭐ Estrellas: {estrellas}</span>
                                    </td>
                                    <td colSpan={2}>⚡ Respuestas rápidas: {fastAnswers}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <button onClick={startCountdown}>Jugar de nuevo</button>
                </div>
            ) : !gameStarted ? (
                countdown === null ? (
                    <div className="no-pierdas-start-screen">
                        <h2>¡Bienvenido a No pierdas los objetos!</h2>
                        <button onClick={startCountdown}>Comenzar Juego</button>
                    </div>
                ) : (
                    <>
                        <section className="no-pierdas-info-row">
                            <div className="stat-item">
                                <strong>Puntaje:</strong> <span>{puntaje}</span>
                            </div>
                            <div className="stat-item">
                                <strong>Errores:</strong> <span>{errorAnswers}</span>
                            </div>
                            <div className="stat-item">
                                <strong>Tiempo restante:</strong> <span aria-live="polite">{tiempoRestante}s</span>
                            </div>
                        </section>
                        <div className="no-pierdas-objetos">
                            <div
                                className={`no-pierdas-tablero ${fondoEstado ? `no-pierdas-tablero-fondo-${fondoEstado}` : ""}`}
                                style={{
                                    width: `${niveles[nivel - 1].dimension}px`,
                                    height: `${niveles[nivel - 1].dimension}px`,
                                }}
                            >
                                <div className="no-pierdas-countdown">{countdown}</div>
                            </div>
                        </div>
                    </>
                )
            ) : (
                <>
                    <section className="no-pierdas-info-row">
                        <div className="stat-item">
                            <strong>Puntaje:</strong> <span>{puntaje}</span>
                        </div>
                        <div className="stat-item">
                            <strong>Errores:</strong> <span>{errorAnswers}</span>
                        </div>
                        <div className="stat-item">
                            <strong>Tiempo restante:</strong> <span aria-live="polite">{tiempoRestante}s</span>
                        </div>
                    </section>
                    <div className="stat-item">
                        <strong>Nivel:</strong> <span>{nivel}</span>
                    </div>
                    <div className="no-pierdas-objetos">
                        <div
                            className={`no-pierdas-tablero ${fondoEstado ? `no-pierdas-tablero-fondo-${fondoEstado}` : ""}`}
                            style={{
                                width: `${niveles[nivel - 1].dimension}px`,
                                height: `${niveles[nivel - 1].dimension}px`
                            }}
                        >
                            {objetos.map((obj, index) => (
                                <div
                                    key={`${obj.id}-${index}`}
                                    className={`no-pierdas-objeto 
                        ${obj.esObjetivo ? 'no-pierdas-objetivo' : 'no-pierdas-distractor'} 
                        ${objetivosSeleccionados.includes(obj.id) ? 'seleccionado' : ''} 
                        ${nivel >= 4 && obj.animado ? 'no-pierdas-animado' : ''}`}
                                    style={{
                                        position: 'absolute',
                                        top: obj.posicion.top,
                                        left: obj.posicion.left
                                    }}
                                    onClick={() => manejarClick(obj.id, obj.esObjetivo)}
                                >
                                    {obj.emoji}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NoPierdasLosObjetos;
