from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from src.database import get_db
from src.routes.auth import get_current_user_id
from src.schemas import ServicoCreate, ServicoUpdate, ServicoAtivoUpdate

router = APIRouter(prefix="/servicos", tags=["Servicos"]) 

@router.get("", response_model=List[dict])
def listar_servicos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Lista serviços ativos"""
    query = text("""
        SELECT id_servico, nome, descricao, preco_base, duracao_padrao, ativo, created_at
        FROM servicos
        WHERE ativo = TRUE
        ORDER BY nome
        LIMIT :limit OFFSET :skip
    """)
    rows = db.execute(query, {"skip": skip, "limit": limit}).fetchall()
    return [dict(r._mapping) for r in rows]

@router.post("", status_code=status.HTTP_201_CREATED)
def criar_servico(payload: ServicoCreate, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    try:
        q = text("""
            INSERT INTO servicos (nome, descricao, preco_base, ativo)
            VALUES (:nome, :descricao, :preco_base, :ativo)
        """)
        db.execute(q, {
            "nome": payload.nome,
            "descricao": payload.descricao,
            "preco_base": payload.preco_base,
            "ativo": payload.ativo if payload.ativo is not None else True
        })
        rid = db.execute(text("SELECT LAST_INSERT_ID() AS id")).fetchone()[0]
        db.commit()
        return {"id_servico": rid, "message": "Serviço criado com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar serviço: {str(e)}")

@router.put("/{id_servico}")
def atualizar_servico(id_servico: int, payload: ServicoUpdate, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    try:
        set_parts = []
        params = {"id": id_servico}
        if payload.nome is not None:
            set_parts.append("nome = :nome"); params["nome"] = payload.nome
        if payload.descricao is not None:
            set_parts.append("descricao = :descricao"); params["descricao"] = payload.descricao
        if payload.preco_base is not None:
            set_parts.append("preco_base = :preco_base"); params["preco_base"] = payload.preco_base
        if not set_parts:
            raise HTTPException(status_code=400, detail="Nada para atualizar")
        q = text(f"UPDATE servicos SET {', '.join(set_parts)} WHERE id_servico = :id")
        db.execute(q, params)
        db.commit()
        return {"message": "Serviço atualizado"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar serviço: {str(e)}")

@router.patch("/{id_servico}/ativo")
def atualizar_ativo(id_servico: int, payload: ServicoAtivoUpdate, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    try:
        q = text("UPDATE servicos SET ativo = :ativo WHERE id_servico = :id")
        db.execute(q, {"ativo": payload.ativo, "id": id_servico})
        db.commit()
        return {"message": f"Serviço {'ativado' if payload.ativo else 'inativado'}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar status: {str(e)}")
