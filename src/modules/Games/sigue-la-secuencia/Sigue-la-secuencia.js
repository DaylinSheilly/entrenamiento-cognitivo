import React, { useState, useEffect } from 'react';
import './MemoriaSecuencial.css';

const MemoriaSecuencial = () => {
  const [stage, setStage] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [errorCount, setErrorCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1); // Índice del número resaltado
  const [selectedIndices, setSelectedIndices] = useState([]); // Índices de los números seleccionados por el usuario
  const [maxErrors, setMaxErrors] = useState(2); // Número máximo de errores permitido
  const [currentClicked, setCurrentClicked] = useState(null); // El número actualmente seleccionado
  const [previousClicked, setPreviousClicked] = useState(null); // El número anteriormente seleccionado

  useEffect(() => {
    generateSequence(stage);
  }, [stage]);

  useEffect(() => {
    if (sequence.length > 0) {
      showSequence();
    }
  }, [sequence]);

  const generateSequence = (currentStage) => {
    const sequenceLength = currentStage * 2; // Incrementa la longitud de la secuencia con cada etapa
    let lastNumber = null;
    let secondLastNumber = null;
    const newSequence = [];
  
    for (let i = 0; i < sequenceLength; i++) {
      let randomNumber;
      do {
        randomNumber = Math.floor(Math.random() * 10); // Genera un número aleatorio entre 0 y 9
      } while (randomNumber === lastNumber || randomNumber === secondLastNumber); // Asegúrate de que el número no sea igual a los dos anteriores
      newSequence.push(randomNumber);
      // Actualiza los dos últimos números
      secondLastNumber = lastNumber;
      lastNumber = randomNumber;
    }
  
    // Restablece los estados de selección
    setCurrentClicked(null);      // Reinicia el número seleccionado actual
    setPreviousClicked(null);     // Reinicia el número previamente seleccionado
    setSequence(newSequence);     // Genera la nueva secuencia
    setUserInput([]);             // Vacía la entrada del usuario
    setSelectedIndices([]);       // Limpia los índices seleccionados
    setHighlightIndex(-1);        // Reinicia el índice resaltado
  
    console.log(newSequence);
  };

  const showSequence = () => {
    let index = 0;
    const timeInterval = Math.max(500, 2000 - stage * 200); // Ajusta el tiempo según la etapa
    const intervalId = setInterval(() => {
      setHighlightIndex(sequence[index]); // Resalta el número actual en la secuencia
      index++;
      if (index === sequence.length + 1) {
        clearInterval(intervalId);
        setHighlightIndex(-1); // Deja de resaltar después de mostrar la secuencia
      }
    }, timeInterval); // Tiempo de espera entre cada número (ajustado por etapa)
  };

  const handleUserInput = (number) => {
    const currentInputIndex = userInput.length;
    const isCorrect = sequence[currentInputIndex] === number;
  
    setUserInput([...userInput, number]);
  
    // Actualiza el estado para reflejar el número clicado actualmente
    setPreviousClicked(currentClicked);  // El clic actual pasa a ser el anterior
    setCurrentClicked(number);           // El nuevo clic se guarda como el actual
  
    if (!isCorrect) {
      setErrorCount(errorCount + 1);
      if (errorCount >= maxErrors) {
        // Retrasa el fin del juego para que el usuario pueda ver el error
        setTimeout(() => {
          setIsGameOver(true);
        }, 1000);
      } else {
        // Retrasa el reinicio de la secuencia para que el usuario pueda ver el error
        setTimeout(() => {
          setUserInput([]);
          setSelectedIndices([]);
          generateSequence(stage);
        }, 1000);
      }
    } else if (currentInputIndex + 1 === sequence.length) {
      if (stage === 9) {
        setTimeout(() => {
          alert("¡Has completado el juego!");
          setIsGameOver(true);
        }, 1000);
      } else {
        // Retrasa el avance a la siguiente etapa
        setTimeout(() => {
          alert("¡Correcto! Pasas a la siguiente etapa.");
          setStage(stage + 1);
        }, 1000);
      }
    }
  };

  const getCircleClass = (number) => {
    // Si el número es el último clicado, aplica la clase 'correct'
    if (number === currentClicked) {
      return 'circle correct';
    }
    if (number === previousClicked) {
      return ''; // El número anterior vuelve a su estado normal
    }
    const selected = selectedIndices.find((index) => index.number === number);
    if (highlightIndex === number) {
      return 'highlight';
    }
    return selected ? (selected.isCorrect ? 'correct' : 'incorrect') : '';
  };

  if (isGameOver) {
  return (
    <div className="game-over-screen">
      <h1>Juego terminado</h1>
      <p>Has cometido dos errores. Inténtalo de nuevo.</p>
      <button 
        className="restart-button"
        onClick={() => {
          setStage(1);        // Reinicia la etapa al nivel 1
          setErrorCount(0);   // Reinicia el contador de errores
          setIsGameOver(false); // Restablece el estado de Game Over
          generateSequence(1);  // Genera la secuencia para el primer nivel
        }}
      >
        Reiniciar juego
      </button>
    </div>
  );
}

  return (
    <div className="centered-game">
    <div className="game-container">
      <h1>Memoria Secuencial</h1>
      <p>Etapa: {stage}</p>
      <div className="circle-container">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <div
            key={number}
            className={`circle ${getCircleClass(number)}`}
            onClick={() => highlightIndex === -1 && handleUserInput(number)}
          >
            {number}
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

export default MemoriaSecuencial;