// src/components/InfoPanel.jsx
import React from 'react';
import './InfoPanel.css';
import { useLocation } from 'react-router-dom';

const gameInfo = {
  "/games/sigue-la-secuencia": {
    title: "Sigue la Secuencia",
    description: "Memoriza y repite la secuencia mostrada.",
    instructions: "Haz clic en las casillas en el orden correcto."
  },
  "/games/sopa-de-letras": {
    title: "Sopa de Letras",
    description: "Encuentra las palabras escondidas en el tablero.",
    instructions: "Selecciona letras adyacentes para formar las palabras."
  },
  "/games/a-fin": {
    title: "A Fin",
    description: "Identifica la mayor cantidad de sinónimos de una palabra objetivo en el tiempo asignado.",
    instructions: 
      "En cada nivel debes lograr al menos 10 aciertos.\n\n" +
      "- Nivel 1: 2 opciones, 60 segundos, pasa con 70% de aciertos.\n" +
      "- Nivel 2: 2 opciones, 60 segundos, pasa con 70% de aciertos.\n" +
      "- Nivel 3: 3 opciones, 45 segundos, pasa con 75% de aciertos.\n" +
      "- Nivel 4: 3 opciones, 45 segundos, pasa con 80% de aciertos.\n" +
      "- Nivel 5: 4 opciones, 30 segundos, pasa con 90% de aciertos.\n\n" +
      "Si superas el nivel, tendrás 10 segundos antes de avanzar automáticamente.\n" +
      "Si fallas, puedes reintentar el nivel.\n\n" +
      "¡Buena suerte y disfruta del desafío!"
  },
  "/games/matriz-de-memoria": {
    title: "Matriz de Memoria",
    description: "Recuerda los patrones.",
    instructions: "Haz clic solo en los cuadrados que se iluminaron."
  },
  "/games/observa-y-compara": {
    title: "Observa y Compara",
    description: "Pon a prueba tu capacidad de concentración.",
    instructions: "Pon atención a la figura que se presenta. Debes identificar si es igual o diferente a la mostrada anteriormente."
  },
  "/games/comparacion-de-colores": {
    "title": "Comparación de Colores",
    "description": "Decide si la condición se cumple o no se cumple.",
    "instructions": 
      "➡️ Flecha derecha: Si la condición del nivel se cumple.\n" +
      "⬅️ Flecha izquierda: Si la condición del nivel NO se cumple.\n\n" +
      "Condiciones de los niveles:\n" +
      "1. Si ambos colores son iguales.\n" +
      "2. Si la palabra en la izquierda coincide con el color de la derecha.\n" +
      "3. Si ni la palabra ni el color coinciden en ambas tarjetas.\n" +
      "4. Si la palabra en la izquierda coincide con el color de la derecha, pero la palabra de la derecha NO coincide con su color.\n\n" +
      "📈 Progresión:\n" +
      "🔹 Cada 4 aciertos consecutivos, subes de nivel.\n" +
      "🔹 Si fallas, pierdes la racha y debes acumular nuevamente 4 aciertos seguidos para subir de nivel.\n\n" +
      "🎯 Puntaje:\n" +
      "🔹 Inicias con 50 puntos.\n" +
      "🔹 +10 puntos por acierto, -5 puntos por error.\n" +
      "🔹 Bono de 100 puntos y 1 estrella por 4 aciertos seguidos.\n\n" +
      "Presiona 'Comenzar Juego' para empezar. ¡Responde rápido y acumula puntos!"
},
  "/games/recuerda-los-objetos": {
    title: "Recuerda los Objetos",
    description: "Memoriza un grupo de objetos y luego identifícalos entre distractores.",
    instructions: "Observa y memoriza los objetos; luego, selecciona aquellos que viste inicialmente en el orden que se presentaron."
  },
  "/games/concentrate-en-objetivo": {
    "title": "Concentrante en el Objetivo",
    "description": "Desafía tu atención, velocidad y precisión en 45 segundos seleccionando la dirección correcta de las flechas.",
    "instructions": "Usa el teclado o haz clic para elegir la dirección correcta.\n" +
      "\n" + "- Nivel 1: Todas las flechas apuntan igual.\n" +
      "- Nivel 2: Una dirección común entre varias.\n" +
      "- Nivel 3: Solo dos flechas iguales.\n" +
      "- Nivel 4: Sin flechas visibles, deduce la dirección.\n" +
      "- Nivel 5: Flechas con colores, elige la que coincida con el color objetivo.\n" +
      "\n" + "Gana 50 puntos por acierto, recibe bonificaciones por rachas y pierde una estrella con cada error."
  },
  "/games/no-pierdas-los-objetos": {
    "title": "No Pierdas los Objetos",
    "description": "Identifica los objetos en el tablero en constante movimiento.",
    "instructions": "Observa el tablero que apaercen en el tablero; luego cuando nuevos objetos aparezcan y se mezclen, debes identificar los primeros al detenerse. Si el tiempo acaba tienes 10 segundos para terminar el nivel en el que estés."
  },
  "/games/color-y-accion": {
    "title": "Concentrate en el Objetivo",
    "description": "Pon a prueba tu concentración revisando el color y dirección de cada círculo.",
    "instructions": "Observa cada círculo: si es verde, presiona la flecha del teclado en la dirección de su movimiento; si es amarillo, presiona la tecla que corresponde a la flecha que aparece en su interior."
  },
  "/games/mira-la-direccion": {
    title: "Mira la Dirección",
    description: "Observa y decide la dirección correcta.",
    instructions: "Utiliza las flechas para indicar la dirección. Si todas las feclas apuntan al mismo sitio se debe presionar la flecha correspondiente. Si las flechas apuntan a diferentes direcciones, se debe presionar la flecha que apunta a la dirección más común."
  },
  "/games/que-sentido-tiene": {
    "title": "¿Qué Sentido Tiene?",
    "description": "Analiza la palabra objetivo para determinar si tiene un significado positivo o negativo.",
    "instructions": "Si la palabra es positiva, presiona la flecha derecha; si es negativa, presiona la flecha izquierda."
  },
  "/games/apunta-acierta": {
    title: "Apunta y Acierta",
    description: "Pon a prueba tu puntería.",
    instructions: "Haz clic en el botón cuando ambos circulos compartan ubicación."
  },
  "/games/construye-la-tuberia": {
    title: "Construye la Tubería",
    description: "Arma la cañería para conducir el flujo.",
    instructions: "Gira las piezas y encájalas correctamente."
  },
  "/games/colorea-el-camino": {
    title: "Colorea el Camino",
    description: "Pinta el camino para llenar de color todo el mapa.",
    instructions: "Selecciona los colores manteniendo el clic en ellos y arrastrando el mouse por todo el mapa para propagar los colores y llenar todo de colores."
  }
};

const InfoPanel = () => {
  const location = useLocation();
  const info = gameInfo[location.pathname] || {
    title: "Juego Desconocido",
    description: "Información no disponible para este juego.",
    instructions: "Revisa las instrucciones en pantalla."
  };

  return (
    <div className="compo-info-panel">
      <h2>{info.title}</h2>
      <div className="info-content">
        <p>{info.description}</p>
        <p>{info.instructions}</p>
      </div>
    </div>
  );
};

export default InfoPanel;
