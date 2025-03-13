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
    "title": "A Fin",
    "description": "Identifica la mayor cantidad de sinónimos de una palabra objetivo en el tiempo asignado.",
    "instructions": "En cada nivel debes lograr al menos 10 aciertos.  - Nivel 1: Se muestran 2 opciones. Tienes 60 segundos. Pasaras de nivel si aciertas el 70% de tus intentos. \n   - Nivel 2: Se presentan 2 opciones. Tienes 60 segundos. Pasaras de nivel si aciertas el 70% de tus intentos.\n   - Nivel 3: Se ofrecen 3 opciones. Tienes 45 segundos. Pasaras de nivel si aciertas el 75% de tus intentos.\n   - Nivel 4: Se muestran 3 opciones. Tienes 45 segundos. Pasaras de nivel si aciertas el 80% de tus intentos.\n   - Nivel 5: Se presentan 4 opciones. Tienes 30 segundos. Pasaras de nivel si aciertas el 90% de tus intentos. \nSi superas el nivel tendras 10 segundos antes de avanzar automáticamente al siguiente nivel. En caso contrario tendrás la opción de reintentar el nivel.\n\n¡Buena suerte y disfruta del desafío!"
  },
  "/games/matriz-de-memoria": {
    title: "Matriz de Memoria",
    description: "Recuerda los patrones.",
    instructions: "Haz clic solo en los cuadrados que se iluminaron."
  },
  "/games/juego-de-atencion": {
    title: "Juego de Atención",
    description: "Pon a prueba tu capacidad de concentración.",
    instructions: "Pon atención a la figura que se presenta. Debes identificar si es igual o diferente a la mostrada anteriormente."
  },
  "/games/comparacion-de-colores": {
    title: "Comparación de Colores",
    description: "Compara y encuentra diferencias entre colores.",
    instructions: "Selecciona el color que cambia."
  },
  "/games/recuerda-los-objetos": {
    title: "Recuerda los Objetos",
    description: "Memoriza un grupo de objetos y luego identifícalos entre distractores.",
    instructions: "Observa y memoriza los objetos; luego, selecciona aquellos que viste inicialmente en el orden que se presentaron."
  },
  "/games/concentrate-en-objetivo": {
    "title": "LE FALTA UN NOMBRE",
    "description": "Desafía tu atención, velocidad y precisión en 45 segundos seleccionando la dirección correcta de las flechas.",
    "instructions": "Usa el teclado para elegir la dirección correcta. - Nivel 1: Todas las flechas iguales. - Nivel 2: Una dirección común entre varias. - Nivel 3: Solo dos flechas iguales. - Nivel 4: Sin flechas visibles, deduce la dirección. - Nivel 5: Flechas con colores: elige la que coincida con el color objetivo. Gana 50 puntos por acierto, recibe bonificaciones por rachas y pierde una estrella con cada error."
  },
  "/games/no-pierdas-los-objetos": {
    "title": "No Pierdas los Objetos",
    "description": "Identifica los objetos en el tablero en constante movimiento.",
    "instructions": "Observa el tablero que apaercen en el tablero; luego cuando nuevos objetos aparezcan y se mezclen, debes identificar los primeros al detenerse. Si el tiempo acaba tienes 10 segundos para terminar el nivel en el que estés."
  },
  "/games/concentrarse-en-el-objetivo": {
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
      <p>{info.description}</p>
      <p>{info.instructions}</p>
    </div>
  );
};

export default InfoPanel;
