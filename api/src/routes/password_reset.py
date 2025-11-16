from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import secrets
import os

from src.database import get_db
from src.auth import get_current_user

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

    # Verificar se o e-mail existe na base de dados
    query = text("""
        SELECT u.id, u.email, u.nome
        FROM usuarios u
        WHERE u.email = :email AND u.ativo = TRUE
    """)
    user = db.execute(query, {"email": request.email}).fetchone()

    if not user:
        # Por segurança, não informar se o e-mail existe ou não
        return {"message": "Se o e-mail estiver cadastrado, você receberá instruções para reset de senha."}

    # Gerar token único para reset
    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(hours=1)  # Token válido por 1 hora

    # Salvar token na base de dados (tabela temporária ou campo na tabela usuarios)
    # Por simplicidade, vamos usar uma tabela de reset_tokens
    try:
        # A tabela password_reset_tokens já foi criada pela migração
        # Inserir token
        db.execute(text("""
            INSERT INTO password_reset_tokens (user_id, email, token, expires_at)
            VALUES (:user_id, :email, :token, :expires_at)
        """), {
            "user_id": user[0],
            "email": request.email,
            "token": reset_token,
            "expires_at": expires_at
        })

        db.commit()

        # Enviar e-mail em background
        background_tasks.add_task(
            MockEmailService.send_password_reset_email,
            request.email,
            reset_token
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

    return {"message": "Se o e-mail estiver cadastrado, você receberá instruções para reset de senha."}

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Confirmar reset de senha usando token"""

    # Verificar se o token é válido
    query = text("""
        SELECT prt.user_id, prt.expires_at, prt.used, u.email
        FROM password_reset_tokens prt
        JOIN usuarios u ON prt.user_id = u.id
        WHERE prt.token = :token
    """)
    token_data = db.execute(query, {"token": request.token}).fetchone()

    if not token_data:
        raise HTTPException(status_code=400, detail="Token inválido")

    user_id, expires_at, used, email = token_data

    # Verificar se token já foi usado
    if used:
        raise HTTPException(status_code=400, detail="Token já foi utilizado")

    # Verificar se token expirou
    if datetime.now() > expires_at:
        raise HTTPException(status_code=400, detail="Token expirado")

    # Validar nova senha (mínimo 8 caracteres)
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter pelo menos 8 caracteres")

    try:
        # Atualizar senha do usuário (usando MD5 por simplicidade - em produção usar bcrypt)
        import hashlib
        hashed_password = hashlib.md5(request.new_password.encode()).hexdigest()

        db.execute(text("""
            UPDATE usuarios
            SET senha = :senha
            WHERE id = :user_id
        """), {
            "senha": hashed_password,
            "user_id": user_id
        })

        # Marcar token como usado
        db.execute(text("""
            UPDATE password_reset_tokens
            SET used = TRUE
            WHERE token = :token
        """), {"token": request.token})

        db.commit()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao atualizar senha")

    return {"message": "Senha atualizada com sucesso"}

@router.get("/verify-reset-token/{token}")
def verify_reset_token(token: str, db: Session = Depends(get_db)):
    """Verificar se um token de reset é válido (para frontend)"""

    query = text("""
        SELECT prt.expires_at, prt.used
        FROM password_reset_tokens prt
        WHERE prt.token = :token
    """)
    token_data = db.execute(query, {"token": token}).fetchone()

    if not token_data:
        raise HTTPException(status_code=400, detail="Token inválido")

    expires_at, used = token_data

    if used:
        raise HTTPException(status_code=400, detail="Token já foi utilizado")

    if datetime.now() > expires_at:
        raise HTTPException(status_code=400, detail="Token expirado")

    return {"valid": True, "message": "Token válido"}