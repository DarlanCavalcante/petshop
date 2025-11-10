from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from src.database import get_db
from src.routes.auth import get_current_user_id

router = APIRouter(prefix="/produtos", tags=["Produtos"]) 

@router.get("", response_model=List[dict])
def listar_produtos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Lista produtos ativos com estoque total agregado."""
    query = text("""
        SELECT 
            p.id_produto,
            p.nome,
            p.codigo_barras,
            p.descricao,
            p.preco_venda,
            p.categoria,
            COALESCE(SUM(e.quantidade), 0) AS estoque_total
        FROM produtos p
        LEFT JOIN estoque e ON p.id_produto = e.id_produto
        WHERE p.ativo = TRUE AND p.deleted_at IS NULL
        GROUP BY p.id_produto
        ORDER BY p.nome
        LIMIT :limit OFFSET :skip
    """)
    result = db.execute(query, {"skip": skip, "limit": limit}).fetchall()
    return [dict(row._mapping) for row in result]
