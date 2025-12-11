from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

from src.database import get_db

class CriarEmpresaRequest(BaseModel):
    nome: str
    email: str
    telefone: str = None
    endereco: str = None
    cnpj: str = None

router = APIRouter(prefix="/empresas", tags=["empresas"])

@router.post("/criar")
def criar_empresa(
    request: CriarEmpresaRequest,
    db: Session = Depends(get_db)
):
    """Criar nova empresa (pendente de aprovação)"""
    # Verificar se email já existe
    query_check = text("SELECT id_empresa FROM empresas WHERE email = :email")
    existing = db.execute(query_check, {"email": request.email}).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    # Inserir empresa pendente
    query_insert = text("""
        INSERT INTO empresas (nome, email, telefone, endereco, cnpj, status, data_cadastro)
        VALUES (:nome, :email, :telefone, :endereco, :cnpj, 'pendente', NOW())
    """)
    db.execute(query_insert, {
        "nome": request.nome,
        "email": request.email,
        "telefone": request.telefone,
        "endereco": request.endereco,
        "cnpj": request.cnpj
    })
    db.commit()

    return {"message": "Empresa criada com sucesso. Aguarde aprovação do administrador."}

@router.get("/test")
def test_route():
    """Rota de teste"""
    return {"test": "empresas ok"}
