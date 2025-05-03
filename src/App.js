// src/App.js
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import './styles/index.css';
import Home from './pages/Home';
import Header from './components/Header';
import CompleteProfile from "./pages/auth/CompleteProfile.jsx";
import UserData from "./pages/UserData";
import Dashboard from './modules/Dashboard/Dashboard';
import GameLayout from './components/GameLayout';
import Games from './modules/Games/games/games.js';
import Game1 from './modules/Games/sigue-la-secuencia/Sigue-la-secuencia';
import Game2 from './modules/Games/sopa-de-letras/Sopa-de-letras';
import Game3 from './modules/Games/a-fin/A-fin';
import Game4 from './modules/Games/Matriz-de-memoria/Memoria.js';
import Game5 from './modules/Games/juego-de-atencion/atencion.jsx';
import Game6 from './modules/Games/comparacion-de-colores/comparacion.js';
import Game7 from './modules/Games/recuerda-los-objetos/recuerda-los-objetos.jsx';
import Game8 from './modules/Games/concentrate-en-objetivo/concentrate.jsx';
import Game9 from './modules/Games/no-pierdas-objetos/no-pierdas-objetos.jsx';
import Game10 from './modules/Games/concentrarse-en-objetivo/concentrarse.jsx';
import Game11 from './modules/Games/mira-la-direccion/mira-la-direccion.jsx';
import Game12 from './modules/Games/que-sentido-tiene/que-sentido-tiene.jsx';
import Game13 from './modules/Games/apunta-acierta/apunta-acierta.jsx';
import Game14 from './modules/Games/construye-la-pipe/construye-la-pipe.jsx';
import Game15 from './modules/Games/colorea-el-camino/colorea-el-camino.jsx';
import ProtectedRoute from "./components/ProtectedRoute";
import LoginButton from "./components/LoginButton";
import RequireProfileComplete from "./components/RequireProfileComplete";

function App() {
  return (
    <>
      <Header />
      <div className="App">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<LoginButton />} />
          <Route path="/register" element={<LoginButton />} />

          <Route path="/complete-profile" element={<CompleteProfile />} />


          <Route element={<ProtectedRoute />}>
            <Route element={<RequireProfileComplete />}>
              <Route path="/" element={<Home />} />

              <Route path="/games" element={<Games />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/usuario" element={<UserData />} />

              <Route
                path="/games/sigue-la-secuencia"
                element={
                  <GameLayout>
                    <Game1 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/sopa-de-letras"
                element={
                  <GameLayout>
                    <Game2 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/a-fin"
                element={
                  <GameLayout>
                    <Game3 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/matriz-de-memoria"
                element={
                  <GameLayout>
                    <Game4 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/juego-de-atencion"
                element={
                  <GameLayout>
                    <Game5 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/comparacion-de-colores"
                element={
                  <GameLayout>
                    <Game6 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/recuerda-los-objetos"
                element={
                  <GameLayout>
                    <Game7 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/concentrate-en-objetivo"
                element={
                  <GameLayout>
                    <Game8 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/no-pierdas-los-objetos"
                element={
                  <GameLayout>
                    <Game9 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/concentrarse-en-el-objetivo"
                element={
                  <GameLayout>
                    <Game10 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/mira-la-direccion"
                element={
                  <GameLayout>
                    <Game11 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/que-sentido-tiene"
                element={
                  <GameLayout>
                    <Game12 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/apunta-acierta"
                element={
                  <GameLayout>
                    <Game13 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/construye-la-tuberia"
                element={
                  <GameLayout>
                    <Game14 />
                  </GameLayout>
                }
              />
              <Route
                path="/games/colorea-el-camino"
                element={
                  <GameLayout>
                    <Game15 />
                  </GameLayout>
                }
              />

              {/* Agrega más rutas aquí en caso de que se añadan nuevos juegos */}
            </Route>
          </Route>
        </Routes>
      </div>
    </>
  );
}

export default App;
