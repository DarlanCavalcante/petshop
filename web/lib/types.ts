// Tipos compartilhados para a aplicação
export interface Cliente {
  id_cliente: number;
  nome: string;
  cpf?: string;
  telefone: string;
  email: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_cep?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  ativo: boolean;
}

export interface Funcionario {
  id_funcionario: number;
  nome: string;
  cargo: string;
  login: string;
  senha: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  ativo: boolean;
}

export interface Pet {
  id_pet: number;
  nome: string;
  especie: string;
  raca?: string;
  data_nascimento?: string;
  id_cliente: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  ativo: boolean;
}

export interface Servico {
  id_servico: number;
  nome: string;
  descricao?: string;
  preco_base: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  ativo: boolean;
}

export interface Produto {
  id_produto: number;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  ativo: boolean;
}

export interface Pacote {
  id_pacote: number;
  nome: string;
  descricao?: string;
  preco_total: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  ativo: boolean;
  servicos?: Servico[];
}

export interface Agendamento {
  id_agendamento: number;
  data: string;
  horario: string;
  status: 'agendado' | 'confirmado' | 'cancelado' | 'concluido' | 'Confirmado' | 'Pendente' | 'Cancelado';
  observacoes?: string;
  id_cliente: number;
  id_funcionario: number;
  id_servico?: number;
  id_pacote?: number;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  funcionario?: Funcionario;
  servico?: Servico;
  pacote?: Pacote;
  servico_nome?: string;
  pet_nome?: string;
  cliente_nome?: string;
  data_hora?: string;
  duracao_estimada?: number;
}

export interface Venda {
  id_venda: number;
  total: number;
  forma_pagamento: string;
  status: 'pendente' | 'pago' | 'cancelado';
  id_cliente: number;
  id_funcionario: number;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
  funcionario?: Funcionario;
  itens?: VendaItem[];
}

export interface VendaItem {
  id_item: number;
  quantidade: number;
  preco_unitario: number;
  id_venda: number;
  id_produto?: number;
  id_servico?: number;
  id_pacote?: number;
  produto?: Produto;
  servico?: Servico;
  pacote?: Pacote;
}

export interface KPI {
  title: string;
  value: string | number;
  change?: string;
  icon?: string;
}

export interface ReceitaDiaria {
  data: string;
  receita: number;
}

export interface ProdutoMaisVendido {
  nome: string;
  vendas: number;
}

export interface VendaPorFuncionario {
  nome: string;
  total: number;
}

// Tipos para formulários
export interface ClienteForm {
  nome: string;
  cpf?: string;
  telefone: string;
  email: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_estado?: string;
  endereco_cep?: string;
}

export interface ServicoForm {
  nome: string;
  descricao?: string;
  preco_base: number;
  duracao?: number;
}

export interface ProdutoForm {
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
}

export interface PacoteForm {
  nome: string;
  descricao?: string;
  servicos: number[];
}

// Tipos para API responses
export interface APIResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para autenticação
export interface LoginCredentials {
  username: string;
  password: string;
  empresa: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  nome: string;
  cargo: string;
  empresa: string;
}