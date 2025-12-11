import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

/**
 * Hook de autenticação global.
 * Gerencia login, logout, sessão, feedback e expiração do token JWT.
 *
 * @returns {object} Estado e métodos de autenticação:
 *   - isAuthenticated: boolean (usuário autenticado)
 *   - token: string|null (JWT)
 *   - empresa: string|null (empresa atual)
 *   - login: (token, empresa) => void
 *   - logout: () => void
 *   - feedback: string|null (mensagem de feedback)
 *   - isLoading: boolean (carregando estado)
 *   - forceLogoutAndNotify: (msg) => void (logout forçado com notificação)
 */
export function useAuth() {
  const router = useRouter();

  // Estado inicial baseado no sessionStorage
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('token');
    }
    return null;
  });

  const [empresa, setEmpresa] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('empresa');
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !!sessionStorage.getItem('token');
    }
    return false;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Realiza login, salva token/empresa e autentica usuário.
   * @param {string} token JWT
   * @param {string} empresa Empresa logada
   */
  const login = useCallback((token: string, empresa: string) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('empresa', empresa);
    setToken(token);
    setEmpresa(empresa);
    setIsAuthenticated(true);
  }, []);

  /**
   * Realiza logout, limpa sessão e redireciona para login.
   */
  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('empresa');
    setToken(null);
    setEmpresa(null);
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  /**
   * Força logout e exibe notificação de erro.
   * Usado por interceptores de API.
   * @param {string} msg Mensagem de erro
   */
  const forceLogoutAndNotify = useCallback((msg: string) => {
    logout();
    toast.error(msg);
  }, [logout]);

  /**
   * Verifica validade do token JWT e força logout se expirado/inválido.
   * @returns {boolean} true se válido, false se inválido/expirado
   */
  const checkTokenValidity = useCallback(() => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        logout();
        return false;
      }
      return true;
    } catch {
      logout();
      return false;
    }
  }, [token, logout]);

  // Checa validade do token sempre que mudar
  useEffect(() => {
    if (token) checkTokenValidity();
  }, [token, checkTokenValidity]);

  return { isAuthenticated, token, empresa, login, logout, isLoading, forceLogoutAndNotify };
}

// Componente de rota protegida
import { ReactNode } from 'react';

/**
 * Componente de rota protegida.
 * Redireciona para login se não autenticado.
 *
 * @param {object} props
 * @param {ReactNode} props.children Conteúdo protegido
 * @returns {JSX.Element|null} Conteúdo se autenticado, senão null
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }
  return <>{children}</>;
}
