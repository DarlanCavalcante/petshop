/**
 * Cliente API centralizado com tratamento de erros, timeout e retry
 */

import { API_URL } from './config';

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: number;
  retryDelay?: number;
}

class APIClient {
  private baseURL: string;
  private defaultTimeout: number = 10000; // 10 segundos

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Pega token do sessionStorage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('token');
  }

  /**
   * Pega código da empresa do sessionStorage
   */
  private getEmpresa(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('empresa');
  }

  /**
   * Faz requisição com timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error: any) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new APIError(408, 'Requisição excedeu o tempo limite');
      }
      throw error;
    }
  }

  /**
   * Trata resposta da API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Token expirado ou inválido
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('empresa');
        window.location.href = '/login';
      }
      throw new APIError(401, 'Sessão expirada. Faça login novamente.');
    }

    // Proibido
    if (response.status === 403) {
      throw new APIError(403, 'Você não tem permissão para acessar este recurso.');
    }

    // Rate limit excedido
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new APIError(
        429,
        `Muitas requisições. Tente novamente em ${retryAfter || '60'} segundos.`
      );
    }

    // Erro do servidor
    if (response.status >= 500) {
      throw new APIError(
        response.status,
        'Erro no servidor. Tente novamente mais tarde.'
      );
    }

    // Tenta parsear JSON
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();

      if (!response.ok) {
        throw new APIError(
          response.status,
          data.detail || data.message || 'Erro na requisição',
          data
        );
      }

      return data as T;
    }

    // Resposta não é JSON
    if (!response.ok) {
      throw new APIError(response.status, `Erro HTTP ${response.status}`);
    }

    return {} as T;
  }

  /**
   * Faz requisição com retry automático
   */
  private async requestWithRetry<T>(
    url: string,
    options: RequestOptions
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retry = 0,
      retryDelay = 1000,
      ...fetchOptions
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions, timeout);
        return await this.handleResponse<T>(response);
      } catch (error: any) {
        lastError = error;

        // Não faz retry para erros 4xx (exceto 429)
        if (error instanceof APIError) {
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            throw error;
          }
        }

        // Se não é a última tentativa, aguarda antes de tentar novamente
        if (attempt < retry) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('Erro desconhecido na requisição');
  }

  /**
   * Método genérico de requisição
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const token = this.getToken();
    const empresa = this.getEmpresa();

    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (empresa) {
      headers['X-Empresa'] = empresa;
    }

    return this.requestWithRetry<T>(url, {
      ...options,
      headers,
    });
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Upload de arquivo
   */
  async upload<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    additionalData?: Record<string, string>
  ): Promise<T> {
    const token = this.getToken();
    const empresa = this.getEmpresa();

    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (empresa) {
      headers['X-Empresa'] = empresa;
    }

    const response = await this.fetchWithTimeout(
      `${this.baseURL}${endpoint}`,
      {
        method: 'POST',
        headers,
        body: formData,
      },
      30000 // 30 segundos para upload
    );

    return this.handleResponse<T>(response);
  }
}

// Instância singleton
export const api = new APIClient(API_URL);

// Tipos de resposta comuns
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface MessageResponse {
  message: string;
}

// Helpers específicos do domínio
export const authAPI = {
  login: (username: string, password: string, empresa: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return api.request<{ access_token: string; token_type: string }>(
      '/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Empresa': empresa,
        },
        body: formData,
      }
    );
  },

  me: () => api.get('/auth/me'),
};

export const clientesAPI = {
  list: () => api.get('/clientes'),
  get: (id: number) => api.get(`/clientes/${id}`),
  create: (data: any) => api.post('/clientes', data),
  update: (id: number, data: any) => api.put(`/clientes/${id}`, data),
  delete: (id: number) => api.delete(`/clientes/${id}`),
};

export const produtosAPI = {
  list: () => api.get('/produtos'),
  get: (id: number) => api.get(`/produtos/${id}`),
  create: (data: any) => api.post('/produtos', data),
  update: (id: number, data: any) => api.put(`/produtos/${id}`, data),
};

export const vendasAPI = {
  list: (skip?: number, limit?: number) => 
    api.get(`/vendas?skip=${skip || 0}&limit=${limit || 50}`),
  get: (id: number) => api.get(`/vendas/${id}`),
  create: (data: any) => api.post('/vendas', data, { retry: 0 }), // Não retenta vendas
};

export const kpisAPI = {
  vendasPorFuncionario: () => api.get('/kpis/vendas-por-funcionario'),
  produtosMaisVendidos: () => api.get('/kpis/produtos-mais-vendidos'),
  receitaDiaria: () => api.get('/kpis/receita-diaria'),
  topClientes: (limit?: number) => 
    api.get(`/kpis/top-clientes?limit=${limit || 10}`),
};
