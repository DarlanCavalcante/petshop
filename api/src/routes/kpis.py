from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.routes.auth import get_current_user_id
from src.schemas import VendasPorFuncionario, ProdutoMaisVendido

router = APIRouter(prefix="/kpis", tags=["KPIs e Relatórios"])

@router.get("/vendas-por-funcionario", response_model=List[VendasPorFuncionario])
def vendas_por_funcionario(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Ranking de vendas por funcionário (últimos 30 dias)"""
    query = "SELECT funcionario_nome, total_vendas, receita_total, ticket_medio FROM vw_vendas_por_funcionario"
    result = db.execute(query).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/produtos-mais-vendidos", response_model=List[ProdutoMaisVendido])
def produtos_mais_vendidos(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Top produtos vendidos (últimos 30 dias)"""
    query = """
        SELECT produto_nome, quantidade_total_vendida, receita_gerada, status_estoque 
        FROM vw_produtos_mais_vendidos 
        LIMIT 20
    """
    result = db.execute(query).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/receita-diaria")
def receita_diaria(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Receita diária (últimos 30 dias)"""
    query = "SELECT * FROM vw_receita_diaria ORDER BY data DESC"
    result = db.execute(query).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/top-clientes")
def top_clientes(limit: int = 10, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Clientes que mais gastaram"""
    from sqlalchemy import text
    # Validar limite
    limit = max(1, min(limit, 100))  # Entre 1 e 100
    query = text("SELECT * FROM vw_top_clientes LIMIT :limit")
    result = db.execute(query, {"limit": limit}).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/agendamentos-resumo")
def agendamentos_resumo(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Resumo de agendamentos por status"""
    query = "SELECT * FROM vw_agendamentos_resumo"
    result = db.execute(query).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/estoque-baixo")
def estoque_baixo(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Produtos com estoque abaixo do mínimo"""
    query = "SELECT * FROM vw_produtos_estoque_baixo"
    result = db.execute(query).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/produtos-vencidos")
def produtos_vencidos(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Produtos com estoque vencido"""
    query = "SELECT * FROM vw_produtos_vencidos"
    result = db.execute(query).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/historico-rupturas")
def historico_rupturas(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Histórico de produtos que zeraram estoque"""
    query = "SELECT * FROM vw_historico_rupturas LIMIT 50"
    result = db.execute(query).fetchall()
    return [dict(row._mapping) for row in result]
