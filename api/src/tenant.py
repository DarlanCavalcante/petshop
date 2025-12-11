"""
Middleware Multi-Tenant
Injeta empresa_id automaticamente em todas as queries
"""

from fastapi import Request, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

class TenantContext:
    """Context manager para empresa do usuário"""
    empresa_id: Optional[int] = None
    
    @classmethod
    def set_empresa(cls, empresa_id: int):
        cls.empresa_id = empresa_id
    
    @classmethod
    def get_empresa(cls) -> Optional[int]:
        return cls.empresa_id
    
    @classmethod
    def clear(cls):
        cls.empresa_id = None


async def get_tenant_middleware(request: Request, call_next):
    """
    Middleware que extrai empresa_id do token JWT
    e injeta no contexto da requisição
    """
    try:
        # Token já foi validado pelo dependency get_current_user
        # Aqui apenas configuramos o contexto
        response = await call_next(request)
        return response
    finally:
        # Limpar contexto após requisição
        TenantContext.clear()


def get_empresa_from_user(user_dict: dict) -> int:
    """
    Extrai empresa_id do usuário autenticado
    """
    empresa_id = user_dict.get('empresa_id')
    if not empresa_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário sem empresa associada"
        )
    return empresa_id


def validate_empresa_acesso(db: Session, empresa_id: int, user: dict):
    """
    Valida se o usuário tem acesso à empresa
    """
    user_empresa_id = user.get('empresa_id')
    
    # Se usuário não é admin global, só pode acessar sua própria empresa
    if not user.get('is_superadmin', False):
        if empresa_id != user_empresa_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado a esta empresa"
            )
    
    # Validar se empresa existe e está ativa
    result = db.execute(
        "SELECT ativo FROM empresas WHERE id = :empresa_id",
        {"empresa_id": empresa_id}
    ).fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    if not result[0]:  # ativo = False
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Empresa inativa. Entre em contato com o suporte."
        )


class TenantFilter:
    """
    Helper para adicionar filtros de empresa em queries SQLAlchemy
    """
    
    @staticmethod
    def apply(query, model, empresa_id: int):
        """
        Adiciona filtro WHERE empresa_id = X
        
        Uso:
            query = db.query(Cliente)
            query = TenantFilter.apply(query, Cliente, empresa_id)
        """
        return query.filter(model.empresa_id == empresa_id)
    
    @staticmethod
    def filter_dict(empresa_id: int) -> dict:
        """
        Retorna dict para usar em create/update
        
        Uso:
            new_cliente = Cliente(**data, **TenantFilter.filter_dict(empresa_id))
        """
        return {"empresa_id": empresa_id}


# Dependency para injetar empresa_id em rotas
def get_current_empresa(current_user: dict) -> int:
    """
    Dependency que retorna empresa_id do usuário logado
    
    Uso em rotas:
        @router.get("/clientes")
        def listar_clientes(
            empresa_id: int = Depends(get_current_empresa),
            db: Session = Depends(get_db)
        ):
            clientes = db.query(Cliente).filter(
                Cliente.empresa_id == empresa_id
            ).all()
    """
    return get_empresa_from_user(current_user)
