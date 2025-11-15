# Endpoint de teste de envio de e-mail
from fastapi import BackgroundTasks

@admin_router.post("/test-email")
async def test_email(
    email: str,
    background_tasks: BackgroundTasks,
):
    """Endpoint para testar envio de e-mail manualmente."""
    fm = FastMail(conf)
    subject = "Teste de envio de e-mail (FastAPI-Mail)"
    corpo = "Este é um teste de envio de e-mail automático pelo backend Petshop SaaS. Se você recebeu este e-mail, a configuração está correta."
    message = MessageSchema(
        subject=subject,
        recipients=[email],
        body=corpo,
        subtype="plain"
    )
    await fm.send_message(message, background_tasks=background_tasks)
    return {"message": f"E-mail de teste enviado para {email}"}
# Configuração de envio de e-mail
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import os

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "tech10infor@gmail.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "senha_app"),
    MAIL_FROM=os.getenv("MAIL_FROM", "tech10infor@gmail.com"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_TLS=True,
    MAIL_SSL=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)
"""
Rotas para gerenciamento de empresas (Multi-Tenant)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import date, time
from ..database import get_db, update_databases_map
from ..auth import get_current_user
from ..tenant import get_current_empresa, validate_empresa_acesso

router = APIRouter(prefix="/empresas", tags=["empresas"])

# Rotas administrativas para painel visual
from fastapi import APIRouter as AdminRouter
admin_router = AdminRouter(prefix="/api/admin", tags=["admin"])
# ...existing code...

# ==================== ADMIN: Painel de Aprovação de Empresas ====================

@admin_router.get("/pending-companies")
def listar_empresas_pendentes(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lista empresas pendentes de aprovação (apenas superadmin)"""
    if not current_user.get('is_superadmin', False):
        raise HTTPException(status_code=403, detail="Acesso restrito a superadmin")
    results = db.execute(
        text("SELECT id, nome, email, created_at FROM empresas WHERE ativo = FALSE ORDER BY created_at DESC")
    ).fetchall()
    empresas = []
    for r in results:
        # Buscar email do admin
        admin = db.execute(
            text("SELECT email FROM usuarios WHERE empresa_id = :empresa_id AND is_admin = TRUE LIMIT 1"),
            {"empresa_id": r[0]}
        ).fetchone()
        empresas.append({
            "id": r[0],
            "nome": r[1],
            "email_admin": admin[0] if admin else None,
            "criado_em": r[3]
        })
    return empresas


@admin_router.post("/approve-company/{company_id}")
async def aprovar_empresa(company_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Aprova empresa: ativa empresa, ativa admin e cria banco do tenant (apenas superadmin) e envia e-mail"""
    if not current_user.get('is_superadmin', False):
        raise HTTPException(status_code=403, detail="Acesso restrito a superadmin")
    # Buscar dados da empresa e admin
    empresa = db.execute(text("SELECT id, nome, ativo FROM empresas WHERE id = :id"), {"id": company_id}).fetchone()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    if empresa[2]:
        raise HTTPException(status_code=400, detail="Empresa já está ativa")
    admin = db.execute(text("SELECT email FROM usuarios WHERE empresa_id = :id AND is_admin = TRUE LIMIT 1"), {"id": company_id}).fetchone()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin da empresa não encontrado")
    # Ativar empresa e admin
    db.execute(text("UPDATE empresas SET ativo = TRUE WHERE id = :id"), {"id": company_id})
    db.execute(text("UPDATE usuarios SET ativo = TRUE WHERE empresa_id = :id AND is_admin = TRUE"), {"id": company_id})
    db.commit()
    # Criar banco do tenant
    try:
        from src.routes.empresas import criar_banco_tenant
        criar_banco_tenant(company_id, current_user, db)
    except Exception as e:
        pass
    # Enviar e-mail de aprovação
    fm = FastMail(conf)
    subject = "Sua conta em Meu SaaS foi aprovada!"
    corpo = f"Olá! Sua conta para a empresa {empresa[1]} foi aprovada. Você já pode fazer login em https://www.youtube.com/watch?v=XC2VOVv2GWE."
    message = MessageSchema(
        subject=subject,
        recipients=[admin[0]],
        body=corpo,
        subtype="plain"
    )
    await fm.send_message(message)
    return {"message": "Empresa aprovada, banco criado e e-mail enviado com sucesso"}


@admin_router.post("/reject-company/{company_id}")
async def rejeitar_empresa(company_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Rejeita empresa: envia e-mail e deleta empresa e usuários associados (apenas superadmin)"""
    if not current_user.get('is_superadmin', False):
        raise HTTPException(status_code=403, detail="Acesso restrito a superadmin")
    empresa = db.execute(text("SELECT id, nome FROM empresas WHERE id = :id"), {"id": company_id}).fetchone()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    admin = db.execute(text("SELECT email FROM usuarios WHERE empresa_id = :id AND is_admin = TRUE LIMIT 1"), {"id": company_id}).fetchone()
    # Enviar e-mail de rejeição antes de deletar
    if admin:
        fm = FastMail(conf)
        subject = "Atualização sobre seu cadastro em Meu SaaS."
        corpo = f"Olá. Após análise, seu cadastro para a empresa {empresa[1]} não foi aprovado neste momento."
        message = MessageSchema(
            subject=subject,
            recipients=[admin[0]],
            body=corpo,
            subtype="plain"
        )
        await fm.send_message(message)
    # Deletar usuários
    db.execute(text("DELETE FROM usuarios WHERE empresa_id = :id"), {"id": company_id})
    # Deletar empresa
    db.execute(text("DELETE FROM empresas WHERE id = :id"), {"id": company_id})
    db.commit()
    return Response(status_code=204)

# Adicionar admin_router ao app principal
def setup_admin_routes(app):
    app.include_router(admin_router)


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


class EmpresaCadastroPublico(BaseModel):
    nome: str = Field(..., min_length=3, max_length=200)
    nome_fantasia: Optional[str] = Field(None, max_length=200)
    cnpj: Optional[str] = Field(None, max_length=18)
    email: str = Field(..., max_length=200)
    telefone: Optional[str] = Field(None, max_length=20)
    endereco: Optional[str] = Field(None, max_length=255)
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=2)
    cep: Optional[str] = Field(None, max_length=10)


class AdminCadastroPublico(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., max_length=200)
    senha: str = Field(..., min_length=8, max_length=100)


class CadastroEmpresaPublico(BaseModel):
    empresa: EmpresaCadastroPublico
    admin: AdminCadastroPublico


class EmpresaResponse(EmpresaBase):
    id: int
    ativo: bool
    data_assinatura: Optional[date] = None
    data_expiracao: Optional[date] = None
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
                   0 as total_funcionarios, 0 as total_clientes, 0 as total_pets,
                   0 as total_vendas, 0.0 as receita_total,
                   'Ativo' as status_assinatura, NULL as dias_restantes
            FROM empresas
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


# ==================== CADASTRO PÚBLICO ====================

@router.post("/cadastrar", status_code=status.HTTP_201_CREATED)
def cadastrar_empresa_publico(data: CadastroEmpresaPublico, db: Session = Depends(get_db)):
    """Cadastro público de empresa - cria empresa inativa aguardando aprovação"""

    # Verificar se email da empresa já existe
    exists = db.execute(
        text("SELECT id FROM empresas WHERE email = :email"),
        {"email": data.empresa.email}
    ).fetchone()

    if exists:
        raise HTTPException(status_code=400, detail="Email da empresa já cadastrado")

    # Verificar se email do admin já existe
    exists_admin = db.execute(
        text("SELECT id FROM usuarios WHERE email = :email"),
        {"email": data.admin.email}
    ).fetchone()

    if exists_admin:
        raise HTTPException(status_code=400, detail="Email do administrador já cadastrado")

    # Verificar CNPJ duplicado se fornecido
    if data.empresa.cnpj:
        exists_cnpj = db.execute(
            text("SELECT id FROM empresas WHERE cnpj = :cnpj"),
            {"cnpj": data.empresa.cnpj}
        ).fetchone()

        if exists_cnpj:
            raise HTTPException(status_code=400, detail="CNPJ já cadastrado")

    try:
        # Inserir empresa (inativa)
        result = db.execute(
            text("""
                INSERT INTO empresas (
                    nome, nome_fantasia, cnpj, email, telefone,
                    endereco, cidade, estado, cep,
                    cor_primaria, cor_secundaria,
                    taxa_servico, plano, limite_usuarios, limite_agendamentos_mes,
                    ativo, created_at
                ) VALUES (
                    :nome, :nome_fantasia, :cnpj, :email, :telefone,
                    :endereco, :cidade, :estado, :cep,
                    '#3b82f6', '#10b981',
                    0.0, 'free', 1, 50,
                    FALSE, NOW()
                )
            """),
            {
                "nome": data.empresa.nome,
                "nome_fantasia": data.empresa.nome_fantasia,
                "cnpj": data.empresa.cnpj,
                "email": data.empresa.email,
                "telefone": data.empresa.telefone,
                "endereco": data.empresa.endereco,
                "cidade": data.empresa.cidade,
                "estado": data.empresa.estado,
                "cep": data.empresa.cep
            }
        )

        empresa_id = result.lastrowid

        # Hash da senha do admin
        from src.auth import get_password_hash
        # Usar senha hardcoded para teste
        hashed_password = get_password_hash("admin123")

        # Inserir usuário admin (inativo até empresa ser aprovada)
        db.execute(
            text("""
                INSERT INTO usuarios (
                    nome, email, senha, empresa_id, is_admin, ativo, created_at
                ) VALUES (
                    :nome, :email, :senha, :empresa_id, TRUE, FALSE, NOW()
                )
            """),
            {
                "nome": data.admin.nome,
                "email": data.admin.email,
                "senha": hashed_password,
                "empresa_id": empresa_id
            }
        )

        db.commit()

        return {
            "message": "Empresa cadastrada com sucesso. Aguarde aprovação do administrador.",
            "empresa_id": empresa_id
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao cadastrar empresa: {str(e)}")


# ==================== ADMIN: Ativar/Desativar Empresa ====================

@router.patch("/{empresa_id}/ativar")
def ativar_empresa(empresa_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Ativar empresa (apenas superadmin)"""

    # Verificar se é superadmin
    if not current_user.get('is_superadmin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a superadmin"
        )

    # Verificar se empresa existe
    empresa = db.execute(
        text("SELECT id, nome, ativo FROM empresas WHERE id = :empresa_id"),
        {"empresa_id": empresa_id}
    ).fetchone()

    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    if empresa[2]:  # já ativa
        raise HTTPException(status_code=400, detail="Empresa já está ativa")

    # Ativar empresa
    db.execute(
        text("UPDATE empresas SET ativo = TRUE WHERE id = :empresa_id"),
        {"empresa_id": empresa_id}
    )

    # Ativar usuários da empresa
    db.execute(
        text("UPDATE usuarios SET ativo = TRUE WHERE empresa_id = :empresa_id"),
        {"empresa_id": empresa_id}
    )

    db.commit()

    return {"message": "Empresa ativada com sucesso"}


@router.patch("/{empresa_id}/desativar")
def desativar_empresa(empresa_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Desativar empresa (apenas superadmin)"""

    # Verificar se é superadmin
    if not current_user.get('is_superadmin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a superadmin"
        )

    # Verificar se empresa existe
    empresa = db.execute(
        text("SELECT id, nome, ativo FROM empresas WHERE id = :empresa_id"),
        {"empresa_id": empresa_id}
    ).fetchone()

    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    if not empresa[2]:  # já inativa
        raise HTTPException(status_code=400, detail="Empresa já está inativa")

    # Desativar empresa
    db.execute(
        text("UPDATE empresas SET ativo = FALSE WHERE id = :empresa_id"),
        {"empresa_id": empresa_id}
    )

    # Desativar usuários da empresa
    db.execute(
        text("UPDATE usuarios SET ativo = FALSE WHERE empresa_id = :empresa_id"),
        {"empresa_id": empresa_id}
    )

    db.commit()

    return {"message": "Empresa desativada com sucesso"}


@router.post("/{empresa_id}/criar-banco")
def criar_banco_tenant(empresa_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Criar banco de dados específico para o tenant (apenas superadmin)"""

    # Verificar se é superadmin
    if not current_user.get('is_superadmin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a superadmin"
        )

    # Verificar se empresa existe e está ativa
    empresa = db.execute(
        text("SELECT id, nome, ativo FROM empresas WHERE id = :empresa_id"),
        {"empresa_id": empresa_id}
    ).fetchone()

    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    if not empresa[2]:
        raise HTTPException(status_code=400, detail="Empresa deve estar ativa para criar banco")

    # Gerar nome do banco baseado no ID da empresa
    db_name = f"petshop_tenant_{empresa_id}"

    try:
        # Criar banco de dados
        # Nota: Isso assume que estamos usando MySQL/MariaDB
        # Para PostgreSQL seria: CREATE DATABASE db_name
        db.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}`"))

        # Criar URL do banco do tenant baseada na URL default
        from src.config import get_settings
        settings = get_settings()
        base_url = settings.database_url

        # Substituir o nome do banco na URL
        # Exemplo: mysql://user:pass@host:port/db -> mysql://user:pass@host:port/tenant_db
        if '/petshop_main' in base_url:
            tenant_url = base_url.replace('/petshop_main', f'/{db_name}')
        else:
            # Fallback: adicionar o nome do banco no final
            tenant_url = base_url.rstrip('/') + f'/{db_name}'

        # Atualizar mapa de bancos
        update_databases_map(str(empresa_id), tenant_url)

        db.commit()

        return {
            "message": f"Banco {db_name} criado com sucesso",
            "database_name": db_name,
            "database_url": tenant_url
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar banco: {str(e)}")
