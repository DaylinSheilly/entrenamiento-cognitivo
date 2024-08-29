import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import './styles/index.css';
import Home from './pages/Home';
import Dashboard from './modules/Dashboard/Dashboard';
import Game1 from './modules/Games/matriz-de-memoria/Matriz-de-memoria';
import Game2 from './modules/Games/sigue-la-secuencia/Sigue-la-secuencia';
import Game3 from './modules/Games/sopa-de-letras/Sopa-de-letras';
import Game4 from './modules/Games/a-fin/A-fin';
// Importar otros juegos aquí

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/games/matriz-de-memoria" element={<Game1 />} />
          <Route path="/games/sigue-la-secuencia" element={<Game2 />} />
          <Route path="/games/sopa-de-letras" element={<Game3 />} />
          <Route path="/games/a-fin" element={<Game4 />} />
          {/* Añadir rutas para otros juegos */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
