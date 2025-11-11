from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import text
from typing import Optional
from datetime import datetime, timedelta
from ..database import get_db_by_empresa
from ..schemas import (
    PacoteCreate, PacoteUpdate, Pacote, PacoteComServicos,
    ClientePacoteCreate, ClientePacoteUpdate, ClientePacote, ClientePacoteDetalhado
)
from ..auth import get_current_user

router = APIRouter(prefix="/pacotes", tags=["pacotes"])

# ==================== CRUD Pacotes ====================

@router.get("", response_model=list[PacoteComServicos])
async def listar_pacotes(
    ativo: Optional[bool] = None,
    tipo: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    x_empresa: str = Header(default="teste")
):
    """Lista todos os pacotes com seus serviços incluídos"""
    db = get_db_by_empresa(x_empresa)
    
    query = """
        SELECT 
            p.*,
            GROUP_CONCAT(
                JSON_OBJECT(
                    'id_servico', s.id_servico,
                    'nome', s.nome,
                    'preco', s.preco_base,
                    'quantidade', ps.quantidade
                )
            ) as servicos_json
        FROM pacotes p
        LEFT JOIN pacotes_servicos ps ON p.id_pacote = ps.id_pacote
        LEFT JOIN servicos s ON ps.id_servico = s.id_servico
        WHERE 1=1
    """
    params = {}
    
    if ativo is not None:
        query += " AND p.ativo = :ativo"
        params["ativo"] = ativo
    
    if tipo:
        query += " AND p.tipo = :tipo"
        params["tipo"] = tipo
    
    query += " GROUP BY p.id_pacote ORDER BY p.nome"
    
    result = db.execute(text(query), params)
    rows = result.fetchall()
    
    pacotes = []
    for row in rows:
        pacote_dict = dict(row._mapping)
        
        # Parse serviços JSON
        servicos = []
        if pacote_dict.get('servicos_json'):
            import json
            servicos_str = pacote_dict['servicos_json']
            # Corrigir formato do GROUP_CONCAT
            servicos_str = f"[{servicos_str}]"
            servicos = json.loads(servicos_str)
        
        pacote_dict['servicos'] = servicos
        pacote_dict.pop('servicos_json', None)
        
        pacotes.append(pacote_dict)
    
    return pacotes


@router.post("", response_model=Pacote, status_code=201)
async def criar_pacote(
    pacote: PacoteCreate,
    current_user: dict = Depends(get_current_user),
    x_empresa: str = Header(default="teste")
):
    """Cria um novo pacote"""
    db = get_db_by_empresa(x_empresa)
    
    # Validar tipo e campos obrigatórios
    if pacote.tipo == 'creditos':
        if not pacote.validade_dias or not pacote.max_usos:
            raise HTTPException(400, "Pacotes tipo 'creditos' precisam de validade_dias e max_usos")
    elif pacote.tipo == 'combo':
        if pacote.validade_dias or pacote.max_usos:
            raise HTTPException(400, "Pacotes tipo 'combo' não devem ter validade_dias ou max_usos")
    else:
        raise HTTPException(400, "Tipo deve ser 'combo' ou 'creditos'")
    
    # Criar pacote
    query = text("""
        INSERT INTO pacotes (nome, descricao, tipo, preco_base, validade_dias, max_usos, ativo)
        VALUES (:nome, :descricao, :tipo, :preco_base, :validade_dias, :max_usos, :ativo)
    """)
    
    result = db.execute(query, {
        "nome": pacote.nome,
        "descricao": pacote.descricao,
        "tipo": pacote.tipo,
        "preco_base": pacote.preco_base,
        "validade_dias": pacote.validade_dias,
        "max_usos": pacote.max_usos,
        "ativo": pacote.ativo
    })
    db.commit()
    id_pacote = result.lastrowid
    
    # Associar serviços
    if pacote.servicos_ids:
        for id_servico in pacote.servicos_ids:
            query_servico = text("""
                INSERT INTO pacotes_servicos (id_pacote, id_servico, quantidade)
                VALUES (:id_pacote, :id_servico, 1)
            """)
            db.execute(query_servico, {"id_pacote": id_pacote, "id_servico": id_servico})
        db.commit()
    
    # Buscar pacote criado
    query_select = text("SELECT * FROM pacotes WHERE id_pacote = :id")
    result = db.execute(query_select, {"id": id_pacote})
    row = result.fetchone()
    
    return dict(row._mapping)


@router.get("/{id_pacote}", response_model=PacoteComServicos)
async def obter_pacote(
    id_pacote: int,
    current_user: dict = Depends(get_current_user),
    x_empresa: str = Header(default="teste")
):
    """Obtém detalhes de um pacote específico"""
    db = get_db_by_empresa(x_empresa)
    
    query = text("""
        SELECT p.*, s.id_servico, s.nome as servico_nome, s.preco_base as servico_preco, ps.quantidade
        FROM pacotes p
        LEFT JOIN pacotes_servicos ps ON p.id_pacote = ps.id_pacote
        LEFT JOIN servicos s ON ps.id_servico = s.id_servico
        WHERE p.id_pacote = :id
    """)
    
    result = db.execute(query, {"id": id_pacote})
    rows = result.fetchall()
    
    if not rows:
        raise HTTPException(404, "Pacote não encontrado")
    
    # Montar resposta
    pacote_dict = dict(rows[0]._mapping)
    servicos = []
    
    for row in rows:
        if row.id_servico:
            servicos.append({
                "id_servico": row.id_servico,
                "nome": row.servico_nome,
                "preco": float(row.servico_preco),
                "quantidade": row.quantidade
            })
    
    # Limpar campos de serviço do pacote
    for key in ['id_servico', 'servico_nome', 'servico_preco', 'quantidade']:
        pacote_dict.pop(key, None)
    
    pacote_dict['servicos'] = servicos
    
    return pacote_dict


@router.put("/{id_pacote}", response_model=Pacote)
async def atualizar_pacote(
    id_pacote: int,
    pacote: PacoteUpdate,
    current_user: dict = Depends(get_current_user),
    x_empresa: str = Header(default="teste")
):
    """Atualiza um pacote existente"""
    db = get_db_by_empresa(x_empresa)
    
    # Verificar se existe
    check = db.execute(text("SELECT * FROM pacotes WHERE id_pacote = :id"), {"id": id_pacote})
    if not check.fetchone():
        raise HTTPException(404, "Pacote não encontrado")
    
    # Montar UPDATE dinâmico
    updates = []
    params = {"id": id_pacote}
    
    if pacote.nome is not None:
        updates.append("nome = :nome")
        params["nome"] = pacote.nome
    
    if pacote.descricao is not None:
        updates.append("descricao = :descricao")
        params["descricao"] = pacote.descricao
    
    if pacote.preco_base is not None:
        updates.append("preco_base = :preco_base")
        params["preco_base"] = pacote.preco_base
    
    if pacote.validade_dias is not None:
        updates.append("validade_dias = :validade_dias")
        params["validade_dias"] = pacote.validade_dias
    
    if pacote.max_usos is not None:
        updates.append("max_usos = :max_usos")
        params["max_usos"] = pacote.max_usos
    
    if pacote.ativo is not None:
        updates.append("ativo = :ativo")
        params["ativo"] = pacote.ativo
    
    if updates:
        query = text(f"UPDATE pacotes SET {', '.join(updates)} WHERE id_pacote = :id")
        db.execute(query, params)
        db.commit()
    
    # Atualizar serviços se fornecido
    if pacote.servicos_ids is not None:
        # Remover associações antigas
        db.execute(text("DELETE FROM pacotes_servicos WHERE id_pacote = :id"), {"id": id_pacote})
        
        # Adicionar novas
        for id_servico in pacote.servicos_ids:
            query_servico = text("""
                INSERT INTO pacotes_servicos (id_pacote, id_servico, quantidade)
                VALUES (:id_pacote, :id_servico, 1)
            """)
            db.execute(query_servico, {"id_pacote": id_pacote, "id_servico": id_servico})
        
        db.commit()
    
    # Retornar atualizado
    result = db.execute(text("SELECT * FROM pacotes WHERE id_pacote = :id"), {"id": id_pacote})
    row = result.fetchone()
    
    return dict(row._mapping)


@router.delete("/{id_pacote}", status_code=204)
async def deletar_pacote(
    id_pacote: int,
    current_user: dict = Depends(get_current_user),
    x_empresa: str = Header(default="teste")
):
    """Deleta um pacote (soft delete - apenas marca como inativo)"""
    db = get_db_by_empresa(x_empresa)
    
    result = db.execute(
        text("UPDATE pacotes SET ativo = FALSE WHERE id_pacote = :id"),
        {"id": id_pacote}
    )
    
    if result.rowcount == 0:
        raise HTTPException(404, "Pacote não encontrado")
    
    db.commit()
    return None
