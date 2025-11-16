from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, timedelta
import secrets
import hashlib
from typing import Optional

from src.database import get_db
from src.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/auth", tags=["Autenticação"])

router = APIRouter(prefix="/auth", tags=["Autenticação"])

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class MockEmailService:
    """Serviço de e-mail mockado para desenvolvimento"""

    @staticmethod
    async def send_password_reset_email(email: str, reset_token: str):
        """Simula envio de e-mail de reset de senha"""
        reset_link = f"https://petshop.tech10cloud.com/reset-password?token={reset_token}"

        # Em produção, isso seria enviado por e-mail real
        print(f"""
        === E-MAIL DE RESET DE SENHA ===
        Para: {email}
        Assunto: Reset de Senha - Petshop SaaS
        Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

        Você solicitou um reset de senha para sua conta.

        Clique no link abaixo para redefinir sua senha:
        {reset_link}

        Este link é válido por 1 hora.

        Se você não solicitou este reset, ignore este e-mail.

        Atenciosamente,
        Equipe Petshop SaaS
        === FIM DO E-MAIL ===
        """)

        return True

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Solicitar reset de senha - envia e-mail com link de reset"""

    # Validar formato do email
    if not request.email or "@" not in request.email:
        raise HTTPException(status_code=400, detail="Email inválido")

    # Verificar se o e-mail existe na base de dados (query otimizada)
    query = text("""
        SELECT u.id, u.email, u.nome
        FROM usuarios u
        WHERE u.email = :email AND u.ativo = TRUE
        LIMIT 1
    """)
    user = db.execute(query, {"email": request.email.strip().lower()}).fetchone()

    if not user:
        # Por segurança, não informar se o e-mail existe ou não
        return {"message": "Se o e-mail estiver cadastrado, você receberá instruções para reset de senha."}

    # Verificar se já existe um token ativo para este usuário
    existing_token_query = text("""
        SELECT COUNT(*) as token_count
        FROM password_reset_tokens
        WHERE user_id = :user_id AND used = FALSE AND expires_at > NOW()
    """)
    token_count = db.execute(existing_token_query, {"user_id": user[0]}).scalar()

    if token_count > 0:
        # Já existe token ativo, não criar outro
        return {"message": "Se o e-mail estiver cadastrado, você receberá instruções para reset de senha."}

    # Gerar token único para reset
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(hours=1)  # Token válido por 1 hora

    # Salvar token na base de dados
    try:
        # Inserir token
        db.execute(text("""
            INSERT INTO password_reset_tokens (user_id, email, token, expires_at, created_at)
            VALUES (:user_id, :email, :token, :expires_at, NOW())
        """), {
            "user_id": user[0],
            "email": request.email.strip().lower(),
            "token": reset_token,
            "expires_at": expires_at
        })

        db.commit()

        # Enviar e-mail em background
        background_tasks.add_task(
            MockEmailService.send_password_reset_email,
            request.email.strip().lower(),
            reset_token
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

    return {"message": "Se o e-mail estiver cadastrado, você receberá instruções para reset de senha."}

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Confirmar reset de senha usando token"""

    # Verificar se o token é válido e não expirou
    query = text("""
        SELECT prt.user_id, prt.expires_at, prt.used, u.email
        FROM password_reset_tokens prt
        JOIN usuarios u ON prt.user_id = u.id
        WHERE prt.token = :token AND prt.used = FALSE AND prt.expires_at > NOW()
    """)
    token_data = db.execute(query, {"token": request.token}).fetchone()

    if not token_data:
        raise HTTPException(status_code=400, detail="Token inválido, expirado ou já utilizado")

    user_id, expires_at, used, email = token_data

    # Validar nova senha
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 8 caracteres")

    # Verificar se senha contém caracteres especiais
    if not any(char.isdigit() for char in request.new_password):
        raise HTTPException(status_code=400, detail="A senha deve conter pelo menos um número")

    try:
        # Gerar hash seguro da senha usando bcrypt
        hashed_password = get_password_hash(request.new_password)

        # Atualizar senha do usuário
        db.execute(text("""
            UPDATE usuarios
            SET senha = :senha, updated_at = NOW()
            WHERE id = :user_id
        """), {
            "senha": hashed_password,
            "user_id": user_id
        })

        # Marcar token como usado
        db.execute(text("""
            UPDATE password_reset_tokens
            SET used = TRUE, updated_at = NOW()
            WHERE token = :token
        """), {"token": request.token})

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao atualizar senha")

    return {"message": "Senha atualizada com sucesso"}

@router.get("/verify-reset-token/{token}")
async def verify_reset_token(token: str, db: Session = Depends(get_db)):
    """Verificar se um token de reset é válido (para frontend)"""

    if not token or len(token) < 10:
        raise HTTPException(status_code=400, detail="Token inválido")

    query = text("""
        SELECT prt.expires_at, prt.used
        FROM password_reset_tokens prt
        WHERE prt.token = :token AND prt.used = FALSE AND prt.expires_at > NOW()
        LIMIT 1
    """)
    token_data = db.execute(query, {"token": token}).fetchone()

    if not token_data:
        raise HTTPException(status_code=400, detail="Token inválido, expirado ou já utilizado")

    return {"valid": True, "message": "Token válido"}


@router.delete("/cleanup-expired-tokens")
async def cleanup_expired_tokens(db: Session = Depends(get_db)):
    """Limpar tokens expirados (manutenção) - deve ser chamado periodicamente"""
    try:
        result = db.execute(text("""
            DELETE FROM password_reset_tokens
            WHERE expires_at < NOW() OR (used = TRUE AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
        """))

        deleted_count = result.rowcount
        db.commit()

        return {"message": f"{deleted_count} tokens expirados removidos com sucesso"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao limpar tokens expirados")