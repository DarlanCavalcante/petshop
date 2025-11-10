from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from src.database import get_db
from src.auth import verify_password, create_access_token, get_current_user as get_user_from_token
from src.schemas import Token, UserResponse
from src.config import get_settings
from sqlalchemy import text

router = APIRouter(prefix="/auth", tags=["Autenticação"])
settings = get_settings()

@router.post("/login", response_model=Token)
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login com credenciais do funcionário"""
    # Determinar empresa pelo header X-Empresa (padrão: default)
    empresa_code = request.headers.get("X-Empresa") or request.headers.get("x-empresa") or "default"

    # Busca funcionário no banco (no banco selecionado pelo header via get_db)
    query = text("""
        SELECT f.id_funcionario, f.login, f.senha, f.nome, f.cargo
        FROM funcionarios f
        WHERE f.login = :login AND f.ativo = TRUE
    """)
    result = db.execute(query, {"login": form_data.username}).fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login ou senha incorretos, ou empresa inativa",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verifica senha (assumindo que está em hash bcrypt no banco)
    # NOTA: Se as senhas no banco não estão em hash, precisa ajustar
    if not verify_password(form_data.password, result[2]):  # result.senha
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Cria token JWT contendo a empresa (código) para roteamento das próximas requisições
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={
            "sub": result[1],  # login
            "id_funcionario": result[0],  # id_funcionario
            "nome": result[3],  # nome
            "cargo": result[4],  # cargo
            "empresa": empresa_code  # empresa (código do banco)
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_current_user_endpoint(current_user: dict = Depends(get_user_from_token)):
    """Retorna dados do usuário logado"""
    return {
        "id": current_user.get("id"),
        "login": current_user.get("login"),
        "nome": current_user.get("nome"),
        "cargo": current_user.get("cargo"),
        "empresa_id": current_user.get("empresa_id"),
        "empresa_nome": current_user.get("empresa_nome")
    }

# Dependência usada por outros routers para obter apenas o ID do usuário
def get_current_user_id(current_user: dict = Depends(get_user_from_token)) -> int:
    user_id = current_user.get("id") or current_user.get("id_funcionario")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não autenticado")
    return user_id

