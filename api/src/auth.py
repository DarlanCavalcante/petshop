from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from src.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha plain bate com o hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Gera hash bcrypt da senha"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria token JWT com expiração"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

from functools import lru_cache
import time

# Cache simples para tokens decodificados (TTL 5 minutos)
_token_cache = {}

def decode_access_token(token: str):
    """Decodifica e valida token JWT com cache"""
    current_time = time.time()

    # Verifica cache
    if token in _token_cache:
        cached_payload, cache_time = _token_cache[token]
        if current_time - cache_time < 300:  # 5 minutos
            return cached_payload

    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])

        # Verifica expiração
        exp = payload.get("exp")
        if exp and current_time > exp:
            return None

        # Cache o payload válido
        _token_cache[token] = (payload, current_time)

        return payload
    except JWTError:
        return None

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency global para obter usuário autenticado
    Retorna dict com: id, nome, cargo, empresa_id, empresa_nome
    """
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "id": payload.get("id_funcionario"),
        "login": payload.get("sub"),
        "nome": payload.get("nome"),
        "cargo": payload.get("cargo"),
        "empresa_id": payload.get("empresa_id") or (1 if payload.get("empresa") == "teste" else None),  # Compatibilidade
        "empresa_nome": payload.get("empresa"),
        "is_superadmin": payload.get("cargo") == "admin" and (payload.get("empresa_id") == 1 or payload.get("empresa") == "teste")
    }

