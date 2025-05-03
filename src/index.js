import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';

// Componente contenedor para manejar redirecciones de Auth0
const Auth0ProviderWithNavigate = ({ children }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    // Redirige a /home después de login
    navigate(appState?.returnTo || '/home');
  };

  return (
    <Auth0Provider
      domain="dev-fynybihn682z8p6r.us.auth0.com"
      clientId="0dI6McBBB7sukKfr8PQm96t88FpJECKy"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://api.neurosite.com",
        scope: "openid profile email",
      }}
      onRedirectCallback={onRedirectCallback}
      logoutParams={{
        returnTo: window.location.origin + "/home"
      }}
    >
      {children}
    </Auth0Provider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Auth0ProviderWithNavigate>
      <App />
    </Auth0ProviderWithNavigate>
  </BrowserRouter>
);

reportWebVitals();
