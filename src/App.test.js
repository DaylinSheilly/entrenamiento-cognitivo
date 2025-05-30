jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn().mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    user: { name: 'Test User' },
    getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
  }),
  withAuthenticationRequired: (component) => component,
}));
jest.mock('axios', () => ({
  get: jest.fn()
    .mockResolvedValueOnce({ // Mock para /auth/me
      data: {
        profile_complete: true,
        name: "Usuario Test"
      }
    })
    .mockResolvedValue({ // Mock por defecto para otras llamadas
      data: []
    }),
  post: jest.fn(),
  put: jest.fn(() => Promise.resolve({})),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn()
  }))
}));
jest.mock('@mui/x-date-pickers', () => ({
  DatePicker: () => <div data-testid="mock-date-picker" />,
}));
jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({}));
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <div>{children}</div>,
}));
jest.mock('date-fns', () => ({}));
jest.mock('date-fns/locale', () => ({})); // <-- agrega esto
jest.mock('date-fns/locale/es', () => ({})); // <-- y esto si usas 'es'
jest.mock('./modules/Games/sigue-la-secuencia/Sigue-la-secuencia', () => ({
  __esModule: true,
  default: () => <div data-testid="juego-1">Game1</div>
}));
jest.mock('./modules/Games/sopa-de-letras/Sopa-de-letras', () => ({
  __esModule: true,
  default: () => <div data-testid="juego-2">Game2</div>
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

beforeEach(() => {
  require('@auth0/auth0-react').useAuth0.mockReturnValue({
    isAuthenticated: false, // o true según el test
    isLoading: false,
    user: null,
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
    getAccessTokenSilently: jest.fn(),
  });
});

test('renderiza el encabezado de la aplicación', () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  // Solo selecciona el logo del header
  expect(
    screen.getByText((content, element) =>
      element.tagName.toLowerCase() === 'a' && content === 'NeuroSite'
    )
  ).toBeInTheDocument();
});

test('renderiza la página de inicio en la ruta "/home"', () => {
  render(
    <MemoryRouter initialEntries={['/home']}>
      <App />
    </MemoryRouter>
  );
  // Busca algo que solo esté en Home, por ejemplo un texto o título
  expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
});

test('renderiza el botón de login en /login', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );
  // Busca el botón de login por su texto o rol
  expect(screen.getAllByRole('button', { name: /INICIAR SESIÓN|LOGIN/i }).length).toBeGreaterThan(0);
});

test('renderiza la página de completar perfil', () => {
  render(
    <MemoryRouter initialEntries={['/complete-profile']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/completa tu perfil/i)).toBeInTheDocument();
});

describe('Pruebas de navegación básica', () => {
  test('Redirige a login cuando intenta acceder a dashboard sin autenticar', () => {
    // Mock de Auth0 no autenticado
    require('@auth0/auth0-react').useAuth0.mockReturnValue({
      isAuthenticated: false,
      loginWithRedirect: jest.fn()
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/INICIAR SESIÓN|LOGIN/i)).toBeInTheDocument();
  });

  test('Muestra dashboard cuando el usuario está autenticado', async () => {
    require('@auth0/auth0-react').useAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      loginWithRedirect: jest.fn(),
      logout: jest.fn(),
      getAccessTokenSilently: jest.fn()
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    // Usa un matcher flexible si el texto no es exacto
    expect(await screen.findByText((t) => /panel de control/i.test(t) || /dashboard/i.test(t))).toBeInTheDocument();
  });
});

describe('Pruebas de rutas de juegos', () => {
  beforeEach(() => {
    // Mock de Auth0 para usuario autenticado y perfil completo
    require('@auth0/auth0-react').useAuth0.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test User' },
      getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
    });

    // Mock de perfil completo para /auth/me
    require('axios').get.mockImplementation((url) => {
      if (url.includes('/auth/me')) {
        return Promise.resolve({
          data: {
            profile_complete: true,
            name: "Usuario Test"
          }
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test('Renderiza juego 1 en su ruta específica', async () => {
    render(
      <MemoryRouter initialEntries={['/games/sigue-la-secuencia']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('juego-1')).toBeInTheDocument();
  });

  test('Renderiza juego 2 en su ruta específica', async () => {
    render(
      <MemoryRouter initialEntries={['/games/sopa-de-letras']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('juego-2')).toBeInTheDocument();
  });
});

describe('Pruebas de manejo de usuario', () => {
  test('Muestra formulario de completar perfil con datos', async () => {
    // Mock de axios para el perfil de usuario
    require('axios').get.mockResolvedValueOnce({
      data: {
        name: "Usuario Test",
        age: 25,
        preferences: {}
      }
    });

    render(
      <MemoryRouter initialEntries={['/complete-profile']}>  {/* <- Cambiado a /complete-profile */}
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByLabelText(/Nombre de usuario/i)).toBeInTheDocument();
  });
});

describe('Pruebas de interacción de usuario', () => {
  test('Cierra sesión después de inactividad', async () => {
    jest.useFakeTimers();
    const mockLogout = jest.fn();

    require('@auth0/auth0-react').useAuth0.mockReturnValue({
      isAuthenticated: true,
      logout: mockLogout,
      getAccessTokenSilently: jest.fn().mockResolvedValue('token'),
      isLoading: false,
      user: { name: "Test User" }
    });

    require('axios').put.mockResolvedValue({}); // Mock axios.put

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    await act(async () => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });

    expect(mockLogout).toHaveBeenCalled();
    jest.useRealTimers();
  });
});