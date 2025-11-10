from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from src.database import get_db
from src.schemas import AgendamentoCreate, Agendamento
from src.routes.auth import get_current_user_id

router = APIRouter(prefix="/agendamentos", tags=["Agendamentos"])

@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
def criar_agendamento(agendamento: AgendamentoCreate, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Cria agendamento usando procedure agendar_servico"""
    query = """
        CALL agendar_servico(
            :id_pet,
            :id_servico,
            :id_funcionario,
            :data_hora,
            :duracao_estimada,
            :observacoes,
            @p_id_agendamento
        )
    """
    
    try:
        db.execute(query, {
            "id_pet": agendamento.id_pet,
            "id_servico": agendamento.id_servico,
            "id_funcionario": agendamento.id_funcionario,
            "data_hora": agendamento.data_hora,
            "duracao_estimada": agendamento.duracao_estimada,
            "observacoes": agendamento.observacoes
        })
        
        result = db.execute("SELECT @p_id_agendamento AS id_agendamento").fetchone()
        db.commit()
        
        return {
            "id_agendamento": result.id_agendamento,
            "message": "Agendamento criado com sucesso"
        }
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
    
    query = f"""
        SELECT * FROM agendamentos
        WHERE {where_sql}
        ORDER BY data_hora DESC
        LIMIT :limit OFFSET :skip
    """
    
    result = db.execute(query, params).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/hoje", response_model=List[dict])
def agendamentos_hoje(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Usa a view vw_agendamentos_hoje"""
    query = "SELECT * FROM vw_agendamentos_hoje"
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
    
    query = "UPDATE agendamentos SET status = :status WHERE id_agendamento = :id"
    try:
        db.execute(query, {"status": novo_status, "id": id_agendamento})
        db.commit()
        return {"message": f"Status atualizado para {novo_status}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro: {str(e)}")
