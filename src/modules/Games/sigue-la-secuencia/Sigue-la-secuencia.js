import React, { useState, useEffect } from 'react';
import './MemoriaSecuencial.css';

const MemoriaSecuencial = () => {
  const [stage, setStage] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [errorCount, setErrorCount] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [maxErrors, setMaxErrors] = useState(2);
  const [currentClicked, setCurrentClicked] = useState(null);
  const [previousClicked, setPreviousClicked] = useState(null);

  useEffect(() => {
    import('./MemoriaSecuencial.css');
    return () => {
        // Limpia el CSS al salir de la vista, si es necesario
    };
  }, []);

  useEffect(() => {
    generateSequence(stage);
  }, [stage]);

  useEffect(() => {
    if (sequence.length > 0) {
      showSequence();
    }
  }, [sequence]);

  const generateSequence = (currentStage) => {
    const sequenceLength = currentStage * 2;
    let lastNumber = null;
    let secondLastNumber = null;
    const newSequence = [];
  
    for (let i = 0; i < sequenceLength; i++) {
      let randomNumber;
      do {
        randomNumber = Math.floor(Math.random() * 10);
      } while (randomNumber === lastNumber || randomNumber === secondLastNumber);
      newSequence.push(randomNumber);
      secondLastNumber = lastNumber;
      lastNumber = randomNumber;
    }
  
    setCurrentClicked(null);
    setPreviousClicked(null);
    setSequence(newSequence);
    setUserInput([]);
    setSelectedIndices([]);
    setHighlightIndex(-1);
  
    console.log(newSequence);
  };

  const showSequence = () => {
    let index = 0;
    const timeInterval = Math.max(500, 2000 - stage * 200);
    const intervalId = setInterval(() => {
      setHighlightIndex(sequence[index]);
      index++;
      if (index === sequence.length + 1) {
        clearInterval(intervalId);
        setHighlightIndex(-1);
      }
    }, timeInterval);
  };

  const handleUserInput = (number) => {
    const currentInputIndex = userInput.length;
    const isCorrect = sequence[currentInputIndex] === number;
  
    setUserInput([...userInput, number]);
  
    setPreviousClicked(currentClicked);
    setCurrentClicked(number);
  
    if (!isCorrect) {
      setErrorCount(errorCount + 1);
      if (errorCount >= maxErrors) {
        setTimeout(() => {
          setIsGameOver(true);
        }, 1000);
      } else {
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
        setTimeout(() => {
          alert("¡Correcto! Pasas a la siguiente etapa.");
          setStage(stage + 1);
        }, 1000);
      }
    }
  };

  const getCircleClass = (number) => {
    if (number === currentClicked) {
      return 'circle correct';
    }
    if (number === previousClicked) {
      return '';
    }
    const selected = selectedIndices.find((index) => index.number === number);
    if (highlightIndex === number) {
      return 'highlight';
    }
    return selected ? (selected.isCorrect ? 'correct' : 'incorrect') : '';
  };

  if (isGameOver) {
    return (
      <div className="game-over-screen-secuancial">
        <h1>Juego terminado</h1>
        <p>Has cometido dos errores. Inténtalo de nuevo.</p>
        <button 
          className="restart-button-secuancial"
          onClick={() => {
            setStage(1);        
            setErrorCount(0);   
            setIsGameOver(false); 
            generateSequence(1);  
          }}
        >
          Reiniciar juego
        </button>
      </div>
    );
  }

  return (
    <div className="centered-game-secuencia">
      <div className="game-container-secuancial">
        <h1>Memoria Secuencial</h1>
        <p>Etapa: {stage}</p>
        <div className="circle-container-secuancial">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
            <div
              key={number}
              className={`circle-secuancial ${getCircleClass(number)}`}
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