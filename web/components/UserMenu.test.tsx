import { render, screen, fireEvent } from '@testing-library/react';
import UserMenu from './UserMenu';
import * as useAuthModule from '@/lib/useAuth';

// Mock do hook useAuth
const mockLogout = jest.fn();

describe('UserMenu', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('exibe links de login/criar conta quando não autenticado', () => {
    jest.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      logout: mockLogout,
    } as any);
    render(<UserMenu />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/criar conta/i)).toBeInTheDocument();
  });

  it('exibe menu de usuário e executa logout', () => {
    jest.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      logout: mockLogout,
    } as any);
    render(<UserMenu />);
    // Abre menu
    fireEvent.click(screen.getByText(/minha conta/i));
    expect(screen.getByText(/perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/sair/i)).toBeInTheDocument();
    // Logout
    fireEvent.click(screen.getByText(/sair/i));
    expect(mockLogout).toHaveBeenCalled();
  });
});
