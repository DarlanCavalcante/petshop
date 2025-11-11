from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi import Request
from typing import Dict, Optional
import json
import os

from src.config import get_settings
from src.auth import decode_access_token

settings = get_settings()

# Cache de engines por empresa
_ENGINES: Dict[str, any] = {}
_DATABASES_MAP: Optional[Dict[str, str]] = None


def _load_databases_map() -> Dict[str, str]:
    """Carrega o mapa de bancos por empresa.
    Ordem de prioridade:
    1) Variável de ambiente DATABASES_JSON (JSON string)
    2) Arquivo databases.json na raiz do projeto da API
    3) Fallback: usar settings.database_url como 'default'
    """
    global _DATABASES_MAP
    if _DATABASES_MAP is not None:
        return _DATABASES_MAP

    # 1) Env var
    env_json = os.getenv("DATABASES_JSON")
    if env_json:
        try:
            _DATABASES_MAP = json.loads(env_json)
            return _DATABASES_MAP
        except Exception:
            pass

    # 2) Arquivo databases.json
    # Tenta caminhos comuns: api/databases.json e ./databases.json
    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "databases.json"),
        os.path.join(os.getcwd(), "databases.json"),
    ]
    for path in candidates:
        try:
            path = os.path.abspath(path)
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    _DATABASES_MAP = json.load(f)
                    return _DATABASES_MAP
        except Exception:
            continue

    # 3) Fallback
    _DATABASES_MAP = {"default": settings.database_url}
    return _DATABASES_MAP


def _get_engine(db_url: str):
    return create_engine(
        db_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=settings.debug
    )


def get_engine_for_empresa(empresa_code: Optional[str]):
    """Retorna (ou cria) engine para a empresa informada.
    Se empresa_code for None, usa 'default'.
    """
    databases = _load_databases_map()
    code = empresa_code or "default"
    db_url = databases.get(code)
    if not db_url:
        # fallback para default
        code = "default"
        db_url = databases.get("default", settings.database_url)

    if code not in _ENGINES:
        _ENGINES[code] = _get_engine(db_url)
    return _ENGINES[code]

Base = declarative_base()


def _extract_empresa_from_request(request: Request) -> Optional[str]:
    """Descobre a empresa da requisição.
    1) Header X-Empresa
    2) Token Bearer (campo 'empresa' ou 'empresa_code')
    """
    # 1) Header explícito
    empresa = request.headers.get("X-Empresa") or request.headers.get("x-empresa")
    if empresa:
        return empresa.strip()

    # 2) Token Bearer
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = decode_access_token(token)
        if payload:
            return payload.get("empresa") or payload.get("empresa_code") or payload.get("empresa_id")
    return None


def get_db(request: Request):
    """Dependency para injetar sessão do banco em rotas FastAPI (multi-banco).
    Seleciona o engine conforme a empresa no header/token.
    """
    empresa_code = _extract_empresa_from_request(request)
    engine = get_engine_for_empresa(empresa_code)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_by_empresa(empresa_code: str = "teste"):
    """Retorna uma sessão de banco para uma empresa específica.
    Útil para rotas async que não usam Depends(get_db).
    IMPORTANTE: O chamador deve fechar a sessão manualmente ou usar context manager.
    """
    engine = get_engine_for_empresa(empresa_code)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()
