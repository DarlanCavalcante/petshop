"""
Rotas para gerenciamento de empresas (Multi-Tenant)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date, time
from ..database import get_db
from ..auth import get_current_user
from ..tenant import get_current_empresa, validate_empresa_acesso

router = APIRouter(prefix="/empresas", tags=["empresas"])


# ==================== SCHEMAS ====================

class EmpresaBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=200)
    nome_fantasia: Optional[str] = Field(None, max_length=200)
    cnpj: Optional[str] = Field(None, max_length=18)
    email: Optional[EmailStr] = None
    telefone: Optional[str] = Field(None, max_length=20)
    
    endereco: Optional[str] = Field(None, max_length=255)
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=2)
    cep: Optional[str] = Field(None, max_length=10)
    
    logo_url: Optional[str] = Field(None, max_length=500)
    cor_primaria: str = Field("#3b82f6", max_length=7)
    cor_secundaria: str = Field("#10b981", max_length=7)
    
    taxa_servico: float = Field(0.0, ge=0, le=100)
    horario_abertura: Optional[time] = None
    horario_fechamento: Optional[time] = None
    dias_funcionamento: str = Field("seg-sab", max_length=50)
    
    plano: str = Field("basic", pattern="^(free|basic|premium|enterprise)$")
    limite_usuarios: int = Field(5, ge=1, le=1000)
    limite_agendamentos_mes: int = Field(100, ge=0)


class EmpresaCreate(EmpresaBase):
    data_assinatura: Optional[date] = None
    data_expiracao: Optional[date] = None


class EmpresaUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=3, max_length=200)
    nome_fantasia: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    cep: Optional[str] = None
    logo_url: Optional[str] = None
    cor_primaria: Optional[str] = None
    cor_secundaria: Optional[str] = None
    taxa_servico: Optional[float] = Field(None, ge=0, le=100)
    horario_abertura: Optional[time] = None
    horario_fechamento: Optional[time] = None
    ativo: Optional[bool] = None


class EmpresaResponse(EmpresaBase):
    id: int
    ativo: bool
    data_assinatura: Optional[date]
    data_expiracao: Optional[date]
    created_at: str
    
    class Config:
        from_attributes = True


class EmpresaDashboard(BaseModel):
    id: int
    nome: str
    plano: str
    ativo: bool
    total_funcionarios: int
    total_clientes: int
    total_pets: int
    total_vendas: int
    receita_total: float
    status_assinatura: str
    dias_restantes: Optional[int]


class ConfiguracaoBase(BaseModel):
    chave: str = Field(..., max_length=100)
    valor: str
    tipo: str = Field("string", pattern="^(string|number|boolean|json)$")
    descricao: Optional[str] = Field(None, max_length=255)


class ConfiguracaoResponse(ConfiguracaoBase):
    id: int
    empresa_id: int
    
    class Config:
        from_attributes = True


# ==================== ENDPOINTS ====================

@router.get("/me", response_model=EmpresaResponse)
def obter_minha_empresa(
    empresa_id: int = Depends(get_current_empresa),
    db: Session = Depends(get_db)
):
    """Retorna dados da empresa do usuário logado"""
    result = db.execute(
        text("""
            SELECT id, nome, nome_fantasia, cnpj, email, telefone,
                   endereco, cidade, estado, cep,
                   logo_url, cor_primaria, cor_secundaria,
                   taxa_servico, horario_abertura, horario_fechamento, dias_funcionamento,
                   plano, ativo, data_assinatura, data_expiracao,
                   limite_usuarios, limite_agendamentos_mes,
                   created_at
            FROM empresas
            WHERE id = :empresa_id AND deleted_at IS NULL
        """),
        {"empresa_id": empresa_id}
    ).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    return {
        "id": result[0],
        "nome": result[1],
        "nome_fantasia": result[2],
        "cnpj": result[3],
        "email": result[4],
        "telefone": result[5],
        "endereco": result[6],
        "cidade": result[7],
        "estado": result[8],
        "cep": result[9],
        "logo_url": result[10],
        "cor_primaria": result[11],
        "cor_secundaria": result[12],
        "taxa_servico": float(result[13]) if result[13] else 0.0,
        "horario_abertura": result[14],
        "horario_fechamento": result[15],
        "dias_funcionamento": result[16],
        "plano": result[17],
        "ativo": result[18],
        "data_assinatura": result[19],
        "data_expiracao": result[20],
        "limite_usuarios": result[21],
        "limite_agendamentos_mes": result[22],
        "created_at": str(result[23])
    }


@router.put("/me", response_model=EmpresaResponse)
def atualizar_minha_empresa(
    data: EmpresaUpdate,
    empresa_id: int = Depends(get_current_empresa),
    db: Session = Depends(get_db)
):
    """Atualiza dados da empresa do usuário logado"""
    
    # Montar query dinâmica com campos fornecidos
    update_fields = []
    params = {"empresa_id": empresa_id}
    
    for field, value in data.dict(exclude_unset=True).items():
        if value is not None:
            update_fields.append(f"{field} = :{field}")
            params[field] = value
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    query = f"""
        UPDATE empresas 
        SET {', '.join(update_fields)}
        WHERE id = :empresa_id AND deleted_at IS NULL
    """
    
    result = db.execute(text(query), params)
    db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    # Retornar empresa atualizada
    return obter_minha_empresa(empresa_id, db)


@router.get("/me/dashboard", response_model=EmpresaDashboard)
def obter_dashboard_empresa(
    empresa_id: int = Depends(get_current_empresa),
    db: Session = Depends(get_db)
):
    """Dashboard com estatísticas da empresa"""
    result = db.execute(
        text("""
            SELECT id, nome, plano, ativo,
                   total_funcionarios, total_clientes, total_pets,
                   total_vendas, receita_total,
                   status_assinatura, dias_restantes
            FROM vw_empresas_dashboard
            WHERE id = :empresa_id
        """),
        {"empresa_id": empresa_id}
    ).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    return {
        "id": result[0],
        "nome": result[1],
        "plano": result[2],
        "ativo": result[3],
        "total_funcionarios": result[4] or 0,
        "total_clientes": result[5] or 0,
        "total_pets": result[6] or 0,
        "total_vendas": result[7] or 0,
        "receita_total": float(result[8]) if result[8] else 0.0,
        "status_assinatura": result[9],
        "dias_restantes": result[10]
    }


# ==================== CONFIGURAÇÕES ====================

@router.get("/me/config", response_model=List[ConfiguracaoResponse])
def listar_configuracoes(
    empresa_id: int = Depends(get_current_empresa),
    db: Session = Depends(get_db)
):
    """Lista todas as configurações da empresa"""
    results = db.execute(
        text("""
            SELECT id, empresa_id, chave, valor, tipo, descricao
            FROM empresa_configuracoes
            WHERE empresa_id = :empresa_id
            ORDER BY chave
        """),
        {"empresa_id": empresa_id}
    ).fetchall()
    
    return [
        {
            "id": r[0],
            "empresa_id": r[1],
            "chave": r[2],
            "valor": r[3],
            "tipo": r[4],
            "descricao": r[5]
        }
        for r in results
    ]


@router.get("/me/config/{chave}")
def obter_configuracao(
    chave: str,
    empresa_id: int = Depends(get_current_empresa),
    db: Session = Depends(get_db)
):
    """Obtém uma configuração específica"""
    result = db.execute(
        text("""
            SELECT valor, tipo
            FROM empresa_configuracoes
            WHERE empresa_id = :empresa_id AND chave = :chave
        """),
        {"empresa_id": empresa_id, "chave": chave}
    ).fetchone()
    
    if not result:
        raise HTTPException(status_code=404, detail="Configuração não encontrada")
    
    valor, tipo = result
    
    # Converter tipo
    if tipo == 'boolean':
        valor = valor.lower() in ('true', '1', 'yes')
    elif tipo == 'number':
        valor = float(valor) if '.' in valor else int(valor)
    elif tipo == 'json':
        import json
        valor = json.loads(valor)
    
    return {"chave": chave, "valor": valor, "tipo": tipo}


@router.put("/me/config/{chave}")
def atualizar_configuracao(
    chave: str,
    data: ConfiguracaoBase,
    empresa_id: int = Depends(get_current_empresa),
    db: Session = Depends(get_db)
):
    """Atualiza ou cria uma configuração"""
    
    # Verificar se existe
    exists = db.execute(
        text("SELECT id FROM empresa_configuracoes WHERE empresa_id = :empresa_id AND chave = :chave"),
        {"empresa_id": empresa_id, "chave": chave}
    ).fetchone()
    
    if exists:
        # Atualizar
        db.execute(
            text("""
                UPDATE empresa_configuracoes
                SET valor = :valor, tipo = :tipo, descricao = :descricao
                WHERE empresa_id = :empresa_id AND chave = :chave
            """),
            {
                "empresa_id": empresa_id,
                "chave": chave,
                "valor": data.valor,
                "tipo": data.tipo,
                "descricao": data.descricao
            }
        )
    else:
        # Criar
        db.execute(
            text("""
                INSERT INTO empresa_configuracoes (empresa_id, chave, valor, tipo, descricao)
                VALUES (:empresa_id, :chave, :valor, :tipo, :descricao)
            """),
            {
                "empresa_id": empresa_id,
                "chave": chave,
                "valor": data.valor,
                "tipo": data.tipo,
                "descricao": data.descricao
            }
        )
    
    db.commit()
    return {"message": "Configuração atualizada com sucesso"}


# ==================== ADMIN: Gerenciar TODAS as empresas ====================
# (Apenas superadmin pode acessar)

@router.get("/", response_model=List[EmpresaDashboard])
def listar_todas_empresas(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista todas as empresas (apenas superadmin)"""
    
    if not current_user.get('is_superadmin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a superadmin"
        )
    
    results = db.execute(
        text("""
            SELECT id, nome, plano, ativo,
                   total_funcionarios, total_clientes, total_pets,
                   total_vendas, receita_total,
                   status_assinatura, dias_restantes
            FROM vw_empresas_dashboard
            ORDER BY nome
        """)
    ).fetchall()
    
    return [
        {
            "id": r[0],
            "nome": r[1],
            "plano": r[2],
            "ativo": r[3],
            "total_funcionarios": r[4] or 0,
            "total_clientes": r[5] or 0,
            "total_pets": r[6] or 0,
            "total_vendas": r[7] or 0,
            "receita_total": float(r[8]) if r[8] else 0.0,
            "status_assinatura": r[9],
            "dias_restantes": r[10]
        }
        for r in results
    ]


@router.post("/", response_model=EmpresaResponse, status_code=status.HTTP_201_CREATED)
def criar_empresa(
    data: EmpresaCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cria nova empresa (apenas superadmin)"""
    
    if not current_user.get('is_superadmin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a superadmin"
        )
    
    # Verificar CNPJ duplicado
    if data.cnpj:
        exists = db.execute(
            text("SELECT id FROM empresas WHERE cnpj = :cnpj"),
            {"cnpj": data.cnpj}
        ).fetchone()
        
        if exists:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    # Inserir empresa
    result = db.execute(
        text("""
            INSERT INTO empresas (
                nome, nome_fantasia, cnpj, email, telefone,
                endereco, cidade, estado, cep,
                logo_url, cor_primaria, cor_secundaria,
                taxa_servico, horario_abertura, horario_fechamento, dias_funcionamento,
                plano, data_assinatura, data_expiracao,
                limite_usuarios, limite_agendamentos_mes, ativo
            ) VALUES (
                :nome, :nome_fantasia, :cnpj, :email, :telefone,
                :endereco, :cidade, :estado, :cep,
                :logo_url, :cor_primaria, :cor_secundaria,
                :taxa_servico, :horario_abertura, :horario_fechamento, :dias_funcionamento,
                :plano, :data_assinatura, :data_expiracao,
                :limite_usuarios, :limite_agendamentos_mes, TRUE
            )
        """),
        data.dict()
    )
    db.commit()
    
    empresa_id = result.lastrowid
    
    return obter_minha_empresa(empresa_id, db)
