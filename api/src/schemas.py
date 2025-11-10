from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date

# ============ Auth ============
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    id_funcionario: Optional[int] = None
    login: Optional[str] = None
    empresa_id: Optional[int] = None

class LoginRequest(BaseModel):
    login: str
    senha: str

class UserResponse(BaseModel):
    id: int
    nome: str
    login: str
    cargo: str
    empresa_id: int
    empresa_nome: str

# ============ Cliente ============
class ClienteBase(BaseModel):
    nome: str
    cpf: Optional[str] = None
    telefone: str
    email: EmailStr
    endereco_rua: Optional[str] = None
    endereco_numero: Optional[str] = None
    endereco_complemento: Optional[str] = None
    endereco_bairro: Optional[str] = None
    endereco_cidade: Optional[str] = None
    endereco_estado: Optional[str] = None
    endereco_cep: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[EmailStr] = None
    endereco_cidade: Optional[str] = None

class Cliente(ClienteBase):
    id_cliente: int
    ativo: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============ Pet ============
class PetBase(BaseModel):
    nome: str
    especie: str
    raca: Optional[str] = None
    sexo: Optional[str] = "Não informado"
    peso: Optional[float] = None
    cor: Optional[str] = None
    microchip: Optional[str] = None
    castrado: bool = False
    observacoes: Optional[str] = None
    data_nascimento: Optional[date] = None

class PetCreate(PetBase):
    id_cliente: int

class Pet(PetBase):
    id_pet: int
    id_cliente: int
    ativo: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============ Produto ============
class ProdutoBase(BaseModel):
    nome: str
    codigo_barras: Optional[str] = None
    descricao: Optional[str] = None
    preco_venda: float
    preco_custo: Optional[float] = None
    estoque_minimo: int = 0
    categoria: Optional[str] = None
    id_fornecedor: Optional[int] = None

class Produto(ProdutoBase):
    id_produto: int
    ativo: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============ Agendamento ============
class AgendamentoCreate(BaseModel):
    id_pet: int
    id_servico: int
    id_funcionario: int
    data_hora: datetime
    duracao_estimada: Optional[int] = 60
    observacoes: Optional[str] = None

class Agendamento(BaseModel):
    id_agendamento: int
    data_hora: datetime
    status: str
    id_servico: Optional[int]
    id_pet: Optional[int]
    id_funcionario: Optional[int]
    observacoes: Optional[str]
    valor_servico: Optional[float]
    duracao_estimada: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============ Venda ============
class ItemVenda(BaseModel):
    id_produto: int
    qtd: int
    preco: float

class VendaCreate(BaseModel):
    id_cliente: int
    id_funcionario: int
    itens: list[ItemVenda]
    desconto: float = 0.0

class VendaResponse(BaseModel):
    id_venda: int
    valor_final: float
    message: str = "Venda registrada com sucesso"

# ============ Estoque ============
class EstoqueEntradaCreate(BaseModel):
    id_produto: int
    lote: str
    quantidade: int
    data_vencimento: Optional[date] = None
    tipo: str = "Entrada"
    motivo: str
    id_funcionario: int

class EstoqueResponse(BaseModel):
    id_estoque: int
    quantidade_nova: int
    message: str = "Entrada registrada com sucesso"

# ============ KPIs ============
class VendasPorFuncionario(BaseModel):
    funcionario_nome: str
    total_vendas: int
    receita_total: float
    ticket_medio: float

class ProdutoMaisVendido(BaseModel):
    produto_nome: str
    quantidade_total_vendida: int
    receita_gerada: float
    status_estoque: str
