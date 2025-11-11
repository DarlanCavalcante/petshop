from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from src.database import get_db
from src.schemas import AgendamentoCreate, Agendamento
from src.routes.auth import get_current_user_id

router = APIRouter(prefix="/agendamentos", tags=["Agendamentos"])

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def criar_agendamento(agendamento: AgendamentoCreate, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Cria agendamento usando procedure agendar_servico"""
    query = text("""
        CALL agendar_servico(
            :id_pet,
            :id_servico,
            :id_funcionario,
            :data_hora,
            :duracao_estimada,
            :observacoes,
            @p_id_agendamento
        )
    """)
    
    try:
        # Criar agendamento via procedure
        db.execute(query, {
            "id_pet": agendamento.id_pet,
            "id_servico": agendamento.id_servico,
            "id_funcionario": agendamento.id_funcionario,
            "data_hora": agendamento.data_hora,
            "duracao_estimada": agendamento.duracao_estimada,
            "observacoes": agendamento.observacoes
        })
        result = db.execute(text("SELECT @p_id_agendamento AS id_agendamento")).fetchone()
        new_id = result.id_agendamento
        
        # Se usar pacote, registrar uso
        if agendamento.id_cliente_pacote:
            # Buscar pacote do cliente
            pacote_row = db.execute(text("SELECT cp.id_cliente_pacote, cp.usos_restantes, cp.status, p.tipo FROM clientes_pacotes cp JOIN pacotes p ON cp.id_pacote = p.id_pacote WHERE cp.id_cliente_pacote = :id AND cp.status = 'ativo'"), {"id": agendamento.id_cliente_pacote}).fetchone()
            if not pacote_row:
                raise HTTPException(status_code=400, detail="Pacote inválido ou inativo")
            tipo_pacote = pacote_row.tipo
            usos_restantes = pacote_row.usos_restantes
            
            # Registrar uso
            db.execute(text("""
                INSERT INTO clientes_pacotes_uso (id_cliente_pacote, id_agendamento, id_servico, observacoes)
                VALUES (:id_cliente_pacote, :id_agendamento, :id_servico, :obs)
            """), {
                "id_cliente_pacote": agendamento.id_cliente_pacote,
                "id_agendamento": new_id,
                "id_servico": agendamento.id_servico,
                "obs": agendamento.observacoes
            })
            
            # Atualizar contadores/status
            if tipo_pacote == 'creditos':
                if usos_restantes is None or usos_restantes <= 0:
                    raise HTTPException(status_code=400, detail="Pacote sem créditos disponíveis")
                novo_restante = usos_restantes - 1
                status_novo = 'usado' if novo_restante == 0 else 'ativo'
                db.execute(text("UPDATE clientes_pacotes SET usos_restantes = :restante, status = :status WHERE id_cliente_pacote = :id"), {
                    "restante": novo_restante,
                    "status": status_novo,
                    "id": agendamento.id_cliente_pacote
                })
            else:  # combo
                # Pacote combo é marcado como usado imediatamente
                db.execute(text("UPDATE clientes_pacotes SET status = 'usado' WHERE id_cliente_pacote = :id"), {"id": agendamento.id_cliente_pacote})
        
        db.commit()
        return {"id_agendamento": new_id, "message": "Agendamento criado com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar agendamento: {str(e)}")

@router.get("", response_model=List[Agendamento])
def listar_agendamentos(
    data: str = None, 
    status_agenda: str = None,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: int = Depends(get_current_user_id)
):
    """Lista agendamentos com filtros opcionais"""
    where_clauses = []
    params = {"skip": skip, "limit": limit}
    
    if data:
        where_clauses.append("DATE(data_hora) = :data")
        params["data"] = data
    
    if status_agenda:
        where_clauses.append("status = :status")
        params["status"] = status_agenda
    
    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
    
    query = text(f"""
        SELECT * FROM agendamentos
        WHERE {where_sql}
        ORDER BY data_hora DESC
        LIMIT :limit OFFSET :skip
    """)
    
    result = db.execute(query, params).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/hoje", response_model=List[dict])
def agendamentos_hoje(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Usa a view vw_agendamentos_hoje"""
    query = text("SELECT * FROM vw_agendamentos_hoje")
    result = db.execute(query).fetchall()
    return [dict(row._mapping) for row in result]

@router.patch("/{id_agendamento}/status")
def atualizar_status_agendamento(
    id_agendamento: int, 
    novo_status: str, 
    db: Session = Depends(get_db), 
    current_user: int = Depends(get_current_user_id)
):
    """Atualiza status do agendamento (Agendado → Confirmado → Concluído ou Cancelado)"""
    valid_status = ["Agendado", "Confirmado", "Cancelado", "Concluído"]
    if novo_status not in valid_status:
        raise HTTPException(status_code=400, detail=f"Status inválido. Use: {valid_status}")
    
    query = text("UPDATE agendamentos SET status = :status WHERE id_agendamento = :id")
    try:
        db.execute(query, {"status": novo_status, "id": id_agendamento})
        db.commit()
        return {"message": f"Status atualizado para {novo_status}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro: {str(e)}")


@router.get("/calendario", response_model=list[dict])
def calendario_agendamentos(
    ano: int, 
    mes: int,
    db: Session = Depends(get_db), 
    current_user: int = Depends(get_current_user_id)
):
    """Retorna contagem de agendamentos por dia de um mês específico.
    Uso: /agendamentos/calendario?ano=2025&mes=11
    """
    if mes < 1 or mes > 12:
        raise HTTPException(status_code=400, detail="Mês inválido (1-12)")
    if ano < 2000 or ano > 2100:
        raise HTTPException(status_code=400, detail="Ano inválido")

    query = text("""
        SELECT DATE(data_hora) as dia, COUNT(*) as total
        FROM agendamentos
        WHERE YEAR(data_hora) = :ano AND MONTH(data_hora) = :mes
        GROUP BY DATE(data_hora)
        ORDER BY dia
    """)
    result = db.execute(query, {"ano": ano, "mes": mes}).fetchall()
    return [dict(r._mapping) for r in result]
