import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './page';
import * as apiClientModule from '@/lib/apiClient';
import * as useAuthModule from '@/lib/useAuth';

// Mock do ProtectedRoute para não bloquear o teste
const MockProtectedRoute = ({ children }: { children: React.ReactNode }) => <>{children}</>;
MockProtectedRoute.displayName = 'MockProtectedRoute';
jest.mock('@/components/ProtectedRoute', () => MockProtectedRoute);

// Mock do useAuth para simular usuário autenticado
jest.spyOn(useAuthModule, 'useAuth').mockReturnValue({
  isAuthenticated: true,
  isLoading: false,
  token: 'mock-token',
  empresa: 'teste',
  login: jest.fn(),
  logout: jest.fn(),
  forceLogoutAndNotify: jest.fn(),
  feedback: null,
});

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza KPIs e botões rápidos', async () => {
    const mockApiClient = {
      get: (url: string) => {
        if (url.includes('receita-diaria')) return Promise.resolve({ data: [{ data: '01/11', valor: 1000 }] });
        if (url.includes('produtos-mais-vendidos')) return Promise.resolve({ data: [{ nome: 'Produto Teste', vendas: 10 }] });
        return Promise.resolve({ data: [] });
      },
    };
    jest.spyOn(apiClientModule, 'default').mockReturnValue(mockApiClient);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/nova venda/i)).toBeInTheDocument();
      expect(screen.getByText(/novo agendamento/i)).toBeInTheDocument();
      expect(screen.getByText(/cadastrar produto/i)).toBeInTheDocument();
    });
  });
});
