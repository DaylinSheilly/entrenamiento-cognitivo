import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import './styles/index.css';
import Home from './pages/Home';
import Dashboard from './modules/Dashboard/Dashboard';
import Games from './modules/Games/games/games.js';
import Game1 from './modules/Games/sigue-la-secuencia/Sigue-la-secuencia';
import Game2 from './modules/Games/sopa-de-letras/Sopa-de-letras';
import Game3 from './modules/Games/a-fin/A-fin';
import Game4 from './modules/Games/Matriz-de-memoria/Memoria.js';
import Game5 from './modules/Games/juego-de-atencion/atencion.jsx';
import Game6 from './modules/Games/comparacion-de-colores/comparacion.js';
import Game7 from './modules/Games/recuerda-los-objetos/recuerda-los-objetos.jsx'
import Game8 from './modules/Games/concentrate-en-objetivo/concentrate.jsx'
import Game9 from './modules/Games/no-pierdas-objetos/no-pierdas-objetos.jsx'
import Game10 from './modules/Games/concentrarse-en-objetivo/concentrarse.jsx'
import Game11 from './modules/Games/mira-la-direccion/mira-la-direccion.jsx'
import Game12 from './modules/Games/que-sentido-tiene/que-sentido-tiene.jsx'
// Importar otros juegos aquí

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/games/sigue-la-secuencia" element={<Game1 />} />
          <Route path="/games/sopa-de-letras" element={<Game2 />} />
          <Route path="/games/a-fin" element={<Game3 />} />
          <Route path="/games/matriz-de-memoria" element={<Game4 />} />
          <Route path="/games/juego-de-atencion" element={<Game5 />} />
          <Route path="/games/comparacion-de-colores" element={<Game6 />} />
          <Route path="/games/recuerda-los-objetos" element={<Game7 />} />
          <Route path="/games/concentrate-en-el-objetivo" element={<Game8 />} />
          <Route path="/games/no-pierdas-los-objetos" element={<Game9 />} />
          <Route path="/games/concentrarse-en-el-objetivo" element={<Game10 />} />
          <Route path="/games/mira-la-direccion" element={<Game11 />} />
          <Route path="/games/que-sentido-tiene" element={<Game12 />} />
          {/* Añadir rutas para otros juegos */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;