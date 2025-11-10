from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from src.database import get_db
from src.schemas import VendaCreate, VendaResponse
from src.routes.auth import get_current_user_id

router = APIRouter(prefix="/vendas", tags=["Vendas"])

@router.post("", response_model=VendaResponse)
def registrar_venda(venda: VendaCreate, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Registra nova venda usando a procedure registrar_venda"""
    # Converte itens para JSON
    itens_json = json.dumps([{
        "id_produto": item.id_produto,
        "qtd": item.qtd,
        "preco": item.preco
    } for item in venda.itens])
    
    # Chama procedure
    query = """
        CALL registrar_venda(
            :id_cliente,
            :id_funcionario,
            :itens,
            :desconto,
            @p_id_venda,
            @p_valor_final
        )
    """
    
    try:
        db.execute(query, {
            "id_cliente": venda.id_cliente,
            "id_funcionario": venda.id_funcionario,
            "itens": itens_json,
            "desconto": venda.desconto
        })
        
        # Busca valores de saída
        result = db.execute("SELECT @p_id_venda AS id_venda, @p_valor_final AS valor_final").fetchone()
        db.commit()
        
        return {
            "id_venda": result.id_venda,
            "valor_final": float(result.valor_final),
            "message": "Venda registrada com sucesso"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao registrar venda: {str(e)}")

@router.get("/{id_venda}")
def obter_venda(id_venda: int, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Busca detalhes de uma venda"""
    query = """
        SELECT v.*, c.nome as cliente_nome, f.nome as funcionario_nome
        FROM vendas v
        LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
        LEFT JOIN funcionarios f ON v.id_funcionario = f.id_funcionario
        WHERE v.id_venda = :id
    """
    venda = db.execute(query, {"id": id_venda}).fetchone()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    
    # Busca itens
    query_itens = """
        SELECT iv.*, p.nome as produto_nome
        FROM itens_da_venda iv
        JOIN produtos p ON iv.id_produto = p.id_produto
        WHERE iv.id_venda = :id
    """
    itens = db.execute(query_itens, {"id": id_venda}).fetchall()
    
    return {
        **dict(venda._mapping),
        "itens": [dict(item._mapping) for item in itens]
    }

@router.get("")
def listar_vendas(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Lista vendas recentes"""
    query = """
        SELECT v.id_venda, v.data_hora_venda, v.valor_total, v.desconto, 
               (v.valor_total - v.valor_desconto) as valor_final,
               c.nome as cliente_nome, f.nome as funcionario_nome
        FROM vendas v
        LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
        LEFT JOIN funcionarios f ON v.id_funcionario = f.id_funcionario
        ORDER BY v.data_hora_venda DESC
        LIMIT :limit OFFSET :skip
    """
    result = db.execute(query, {"skip": skip, "limit": limit}).fetchall()
    return [dict(row._mapping) for row in result]
