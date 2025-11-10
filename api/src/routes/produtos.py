from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from pydantic import BaseModel

from src.database import get_db
from src.routes.auth import get_current_user_id

router = APIRouter(prefix="/produtos", tags=["Produtos"]) 

class ProdutoCreate(BaseModel):
    nome: str
    codigo_barras: str
    descricao: str = None
    preco_venda: float
    categoria: str
    estoque_total: int = 0

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

@router.post("", status_code=status.HTTP_201_CREATED)
def criar_produto(produto: ProdutoCreate, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Cria novo produto e adiciona estoque inicial."""
    try:
        # Criar produto
        query_produto = text("""
            INSERT INTO produtos (nome, codigo_barras, descricao, preco_venda, categoria)
            VALUES (:nome, :codigo_barras, :descricao, :preco_venda, :categoria)
        """)
        result = db.execute(query_produto, {
            "nome": produto.nome,
            "codigo_barras": produto.codigo_barras,
            "descricao": produto.descricao,
            "preco_venda": produto.preco_venda,
            "categoria": produto.categoria
        })
        id_produto = result.lastrowid
        
        # Adicionar estoque inicial se houver
        if produto.estoque_total > 0:
            query_estoque = text("""
                INSERT INTO estoque (id_produto, quantidade)
                VALUES (:id_produto, :quantidade)
            """)
            db.execute(query_estoque, {
                "id_produto": id_produto,
                "quantidade": produto.estoque_total
            })
        
        db.commit()
        
        return {
            "id_produto": id_produto,
            "nome": produto.nome,
            "message": "Produto criado com sucesso"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar produto: {str(e)}")

