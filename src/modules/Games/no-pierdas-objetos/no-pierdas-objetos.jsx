import React, { useState, useEffect } from 'react';
import "./no-pierdas-objetos.css";

const emojis = ["🚗", "⭐", "🍎", "⚽", "📖", "✏️", "🌸", "🐕", "☁️", "👟", "🍏", "⚾", "🖊️", "🌺", "🐩", "🧢"];

// Definición de los niveles
const niveles = [
    { objetivos: 1, distractores: 3, movimiento: 100, dimension: 350, previsualizacion: 2000, movimientoTiempo: 3000 },
    { objetivos: 1, distractores: 5, movimiento: 150, dimension: 375, previsualizacion: 2000, movimientoTiempo: 3500 },
    { objetivos: 2, distractores: 7, movimiento: 200, dimension: 400, previsualizacion: 1500, movimientoTiempo: 4000 },
    { objetivos: 2, distractores: 10, movimiento: 250, dimension: 425, previsualizacion: 1500, movimientoTiempo: 4500 },
    { objetivos: 3, distractores: 12, movimiento: 300, dimension: 450, previsualizacion: 1000, movimientoTiempo: 5000 },
    { objetivos: 3, distractores: 15, movimiento: 350, dimension: 460, previsualizacion: 1000, movimientoTiempo: 5500 },
    { objetivos: 4, distractores: 18, movimiento: 400, dimension: 470, previsualizacion: 500, movimientoTiempo: 6000 },
    { objetivos: 4, distractores: 20, movimiento: 450, dimension: 475, previsualizacion: 500, movimientoTiempo: 7000 },
];


const NoPierdasLosObjetos = () => {
    const [nivel, setNivel] = useState(1);
    const [objetos, setObjetos] = useState([]);
    const [juegoTerminado, setJuegoTerminado] = useState(false);
    const [puntaje, setPuntaje] = useState(0); // puntaje
    const [tiempoRestante, setTiempoRestante] = useState(45); // segundos
    const [objetivosSeleccionados, setObjetivosSeleccionados] = useState([]);

    useEffect(() => {
        iniciarNivel(nivel);
    }, [nivel]);

    useEffect(() => {
        if (tiempoRestante <= 0) finalizarJuego();
    }, [tiempoRestante]);

    const iniciarNivel = (nivelActual) => {
        const config = niveles[nivelActual - 1];
        mostrarObjetivos(config);
        setTimeout(() => {
            agregarDistractores(config);
            moverObjetos(config);
        }, config.previsualizacion);
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
        // Agregar clase de animación a todos los objetos antes de iniciar el movimiento
        setObjetos(prevObjetos =>
            prevObjetos.map(obj => ({
                ...obj,
                animado: true // Nuevo campo para controlar la animación
            }))
        );
    
        const intervalo = setInterval(() => {
            setObjetos(prevObjetos => prevObjetos.map(obj => ({
                ...obj,
                posicion: {
                    top: `${Math.max(0, Math.min(config.dimension - 50, parseFloat(obj.posicion.top) + (Math.random() * config.movimiento - config.movimiento / 2)))}px`,
                    left: `${Math.max(0, Math.min(config.dimension - 50, parseFloat(obj.posicion.left) + (Math.random() * config.movimiento - config.movimiento / 2)))}px`
                }
            })));
        }, 500);
    
        setTimeout(() => clearInterval(intervalo), config.movimientoTiempo);
    };

    const manejarClick = (id, esObjetivo) => {
        if (esObjetivo) {
            if (!objetivosSeleccionados.includes(id)) {
                setObjetivosSeleccionados([...objetivosSeleccionados, id]);
                setPuntaje(prev => prev + 10); // Sumar puntos por cada objetivo encontrado
            }

            // Verificar si todos los objetivos han sido seleccionados
            if (objetivosSeleccionados.length + 1 === niveles[nivel - 1].objetivos) {
                avanzarNivel();
            }
        } else {
            setPuntaje(prev => prev - 50); // Penalización por error
            reiniciarNivel(); // Reiniciar nivel si el jugador falla
        }
    };

    const reiniciarNivel = () => {
        setObjetivosSeleccionados([]); // Resetear objetivos seleccionados
        iniciarNivel(nivel); // Volver a iniciar el nivel actual
    };

    const avanzarNivel = () => {
        setObjetivosSeleccionados([]); // Limpiar seleccionados al avanzar
        if (nivel < 8) {
            setNivel(nivel + 1);
        } else {
            finalizarJuego();
        }
    };

    const finalizarJuego = () => {
        setJuegoTerminado(true);
    };

    return juegoTerminado ? (
        <div className="no-pierdas-body">
            <h1>Juego Terminado</h1>
            <p>Puntaje: {puntaje}</p>
            <p>Nivel alcanzado: {nivel}</p>
        </div>
    ) : (
        <div className="no-pierdas-objetos">
            <div className="no-pierdas-info">
                <h1>No pierdas los objetos</h1>
                <p>Puntaje: {puntaje}</p>
                <p>Nivel: {nivel}</p>
                <p>Tiempo restante: {tiempoRestante}s</p>
            </div>
            <div className="no-pierdas-tablero"
                style={{ width: `${niveles[nivel - 1].dimension}px`, height: `${niveles[nivel - 1].dimension}px` }}
            >
                {objetos.map(obj => (
                    <div
                        key={obj.id}
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
    );
};

export default NoPierdasLosObjetos;
