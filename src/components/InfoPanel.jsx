// src/components/InfoPanel.jsx
import React from 'react';
import './InfoPanel.css';
import { useLocation } from 'react-router-dom';

const gameInfo = {
  "/games/sigue-la-secuencia": {
    title: "Sigue la Secuencia",
    description: "Memoriza y repite la secuencia de luces o casillas que se muestran en pantalla. El reto aumenta con cada nivel.",
    instructions: 
      "1. Observa la secuencia de casillas que se ilumina.\n" +
      "2. Cuando termine, haz clic en las casillas en el mismo orden.\n" +
      "3. Si aciertas, la secuencia se hace más larga.\n" +
      "4. Si te equivocas, puedes volver a intentarlo.\n\n" +
      "Consejo: Concéntrate y utiliza patrones o agrupaciones para recordar secuencias largas."
  },
  "/games/sopa-de-letras": {
    title: "Sopa de Letras",
    description: "Encuentra todas las palabras ocultas en la sopa de letras. Algunas pueden estar en diagonal, al revés o vertical.",
    instructions: 
      "1. Busca las palabras de la lista en el tablero.\n" +
      "2. Haz clic y arrastra para seleccionar letras adyacentes (horizontal, vertical o diagonal).\n" +
      "3. Las palabras pueden estar escritas en cualquier dirección.\n" +
      "4. Cada palabra encontrada suma puntos; los errores restan puntos.\n" +
      "5. Usa el botón de 'Pista' si te atoras, pero perderás algunos puntos.\n\n" +
      "Ejemplo: Para seleccionar la palabra 'GATO', haz clic en la 'G' y arrastra hasta la 'O'."
  },
  "/games/a-fin": {
    title: "A Fin",
    description: "Identifica la mayor cantidad de sinónimos de una palabra objetivo en el tiempo asignado. Cada nivel tiene reglas y porcentajes de acierto distintos.",
    instructions: 
      "Debes lograr al menos 10 aciertos por nivel.\n" +
      "El porcentaje de aciertos requerido y el tiempo varían según el nivel:\n" +
      "- Nivel 1 y 2: 2 opciones, 60 segundos, 70% de aciertos.\n" +
      "- Nivel 3 y 4: 3 opciones, 45 segundos, 75% y 80% de aciertos respectivamente.\n" +
      "- Nivel 5: 4 opciones, 30 segundos, 90% de aciertos.\n\n" +
      "Si superas el nivel, tendrás 10 segundos antes de avanzar automáticamente.\n" +
      "Si fallas, puedes reintentar el nivel.\n\n" +
      "Consejo: Piensa rápido y asocia palabras mentalmente antes de elegir."
  },
  "/games/matriz-de-memoria": {
    title: "Matriz de Memoria",
    description: "Pon a prueba tu memoria visual recordando patrones en una cuadrícula.",
    instructions: 
      "Observa los cuadros que se iluminan durante unos segundos.\n" +
      "Cuando se oculten, haz clic en los cuadros que recuerdas que se iluminaron.\n" +
      "Cada acierto suma puntos; los errores restan puntos.\n" +
      "El patrón se vuelve más complejo en cada nivel."
  },
  "/games/observa-y-compara": {
    title: "Observa y Compara",
    description: "Pon a prueba tu capacidad de concentración y comparación visual.",
    instructions: 
      "Observa atentamente la figura que se presenta en pantalla.\n" +
      "Cuando aparezca una nueva figura, decide si es igual o diferente a la anterior.\n" +
      "Usa los botones o teclas correspondientes para responder.\n" +
      "Ganas puntos por cada acierto y pierdes puntos por errores.\n\n" +
      "Consejo: Fíjate en detalles como color, forma o tamaño."
  },
  "/games/comparacion-de-colores": {
    title: "Comparación de Colores",
    description: "Decide rápidamente si la condición de colores se cumple o no en cada tarjeta.",
    instructions: 
      "Usa las flechas del teclado:\n" +
      "  ➡️ Flecha derecha: Si la condición se cumple.\n" +
      "  ⬅️ Flecha izquierda: Si la condición NO se cumple.\n\n" +
      "Condiciones de los niveles:\n" +
      "  Nivel 1: Si ambos colores son iguales.\n" +
      "  Nivel 2: Si la palabra en la izquierda coincide con el color de la derecha.\n" +
      "  Nivel 3: Si ni la palabra ni el color coinciden en ambas tarjetas.\n" +
      "  Nivel 4: Si la palabra en la izquierda coincide con el color de la derecha, pero la palabra de la derecha NO coincide con su color.\n\n" +
      "Progresión:\n" +
      "  - Cada 4 aciertos seguidos subes de nivel.\n" +
      "  - Si fallas, pierdes la racha.\n\n" +
      "Puntaje:\n" +
      "  - Inicias con 50 puntos.\n" +
      "  - +10 por acierto, -5 por error.\n" +
      "  - Bono de 100 puntos y 1 estrella por 4 aciertos seguidos.\n\n" +
      "Consejo: ¡Responde rápido y mantén la concentración!"
  },
  "/games/recuerda-los-objetos": {
    title: "Recuerda los Objetos",
    description: "Memoriza un grupo de objetos y luego identifícalos entre distractores. La dificultad aumenta con cada nivel.",
    instructions: 
      "Observa y memoriza los objetos que aparecen en pantalla.\n" +
      "Después de unos segundos, selecciona los objetos que viste, en el mismo orden.\n" +
      "Entre los objetos habrá distractores para aumentar la dificultad.\n" +
      "Cada acierto suma puntos y cada error resta puntos.\n\n" +
      "Consejo: Usa técnicas de visualización o agrupa los objetos mentalmente."
  },
  "/games/concentrate-en-objetivo": {
    title: "Concentrante en el Objetivo",
    description: "Desafía tu atención, velocidad y precisión en 45 segundos seleccionando la dirección correcta de las flechas.",
    instructions: 
      "Usa el teclado o haz clic para elegir la dirección correcta.\n\n" +
      "Niveles:\n" +
      "  - Nivel 1: Todas las flechas apuntan igual.\n" +
      "  - Nivel 2: Una dirección común entre varias.\n" +
      "  - Nivel 3: Solo dos flechas iguales.\n" +
      "  - Nivel 4: Sin flechas visibles, deduce la dirección.\n" +
      "  - Nivel 5: Flechas con colores, elige la que coincida con el color objetivo.\n\n" +
      "Gana 50 puntos por acierto, recibe bonificaciones por rachas y pierde una estrella con cada error.\n\n" +
      "Consejo: ¡Mantén la calma y responde rápido!"
  },
  "/games/no-pierdas-los-objetos": {
    title: "No Pierdas los Objetos",
    description: "Identifica los objetos en el tablero en constante movimiento. Pon a prueba tu memoria y atención.",
    instructions: 
      "Observa los objetos que aparecen en el tablero.\n" +
      "Cuando nuevos objetos se mezclen, deberás identificar los primeros al detenerse.\n" +
      "Si el tiempo acaba tienes 10 segundos para terminar el nivel en el que estés.\n\n" +
      "Consejo: Fíjate en la posición y características de los objetos."
  },
  "/games/color-y-accion": {
    title: "Color y Acción",
    description: "Pon a prueba tu concentración revisando el color y dirección de cada círculo.",
    instructions: 
      "Observa cada círculo: si es verde, presiona la flecha del teclado en la dirección de su movimiento.\n" +
      "Si es amarillo, presiona la tecla que corresponde a la flecha que aparece en su interior.\n" +
      "Responde lo más rápido posible para sumar puntos extra."
  },
  "/games/mira-la-direccion": {
    title: "Mira la Dirección",
    description: "Observa y decide la dirección correcta en cada ronda. El reto aumenta con cada nivel.",
    instructions: 
      "Utiliza las flechas del teclado para indicar la dirección.\n" +
      "Si todas las flechas apuntan al mismo sitio, presiona la flecha correspondiente.\n" +
      "Si las flechas apuntan a diferentes direcciones, presiona la flecha que apunta a la dirección menos común.\n" +
      "Ganas puntos por aciertos y pierdes puntos por errores."
  },
  "/games/que-sentido-tiene": {
    title: "¿Qué Sentido Tiene?",
    description: "Analiza la palabra objetivo para determinar si tiene un significado positivo o negativo.",
    instructions: 
      "Si la palabra es positiva, presiona la flecha derecha.\n" +
      "Si es negativa, presiona la flecha izquierda.\n" +
      "Gana puntos por cada respuesta correcta."
  },
  "/games/apunta-acierta": {
    title: "Apunta y Acierta",
    description: "Pon a prueba tu puntería y precisión visual.",
    instructions: 
      "Observa ambos círculos en pantalla.\n" +
      "Haz clic en el botón justo cuando ambos círculos compartan ubicación.\n" +
      "Cada acierto suma puntos, cada error resta puntos."
  },
  "/games/construye-la-tuberia": {
    title: "Construye la Cañería",
    description: "Arma la cañería para conducir el flujo de agua de la fuente a la planta.",
    instructions: 
      "1. Gira las piezas haciendo clic sobre ellas para encajarlas correctamente.\n" +
      "2. Cuando creas que la cañería está lista, inicia el flujo.\n" +
      "3. Si el agua llega a la planta sin regarse, avanzas de nivel.\n" +
      "4. Si no, puedes reintentar el nivel."
  },
  "/games/colorea-el-camino": {
    title: "Colorea el Camino",
    description: "Pinta el camino para llenar de color todo el mapa.",
    instructions: 
      "1. Selecciona un color manteniendo el clic sobre él.\n" +
      "2. Arrastra el mouse por todo el mapa para propagar el color.\n" +
      "3. Llena todo el mapa para ganar el nivel.\n\n" +
      "Consejo: Planifica tu ruta antes de comenzar a colorear."
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
