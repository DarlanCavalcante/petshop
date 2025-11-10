from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from src.database import get_db
from src.routes.auth import get_current_user_id

router = APIRouter(prefix="/servicos", tags=["Servicos"]) 

@router.get("", response_model=List[dict])
def listar_servicos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Lista serviços ativos"""
    query = text("""
        SELECT id_servico, nome, descricao, preco_base, ativo, created_at
        FROM servicos
        WHERE ativo = TRUE
        ORDER BY nome
        LIMIT :limit OFFSET :skip
    """)
    rows = db.execute(query, {"skip": skip, "limit": limit}).fetchall()
    return [dict(r._mapping) for r in rows]
