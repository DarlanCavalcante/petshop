from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from datetime import datetime, timedelta

from src.database import get_db, get_db_by_empresa
from src.schemas import Cliente, ClienteCreate, ClienteUpdate, Pet, ClientePacoteCreate, ClientePacoteDetalhado
from src.routes.auth import get_current_user_id
from src.auth import get_current_user

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.get("", response_model=List[Cliente])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Lista todos os clientes ativos"""
    query = text("""
        SELECT id_cliente, nome, cpf, telefone, email, 
               endereco_rua, endereco_numero, endereco_complemento, endereco_bairro,
               endereco_cidade, endereco_estado, endereco_cep, ativo, created_at
        FROM clientes 
        WHERE ativo = TRUE AND deleted_at IS NULL
        ORDER BY nome
        LIMIT :limit OFFSET :skip
    """)
    result = db.execute(query, {"skip": skip, "limit": limit}).fetchall()
    return [dict(row._mapping) for row in result]

@router.get("/{id_cliente}", response_model=Cliente)
def obter_cliente(id_cliente: int, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Busca cliente por ID"""
    query = text("""
        SELECT id_cliente, nome, cpf, telefone, email,
               endereco_rua, endereco_numero, endereco_complemento, endereco_bairro,
               endereco_cidade, endereco_estado, endereco_cep, ativo, created_at
        FROM clientes 
        WHERE id_cliente = :id AND ativo = TRUE AND deleted_at IS NULL
    """)
    result = db.execute(query, {"id": id_cliente}).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return dict(result._mapping)

@router.get("/{id_cliente}/pets", response_model=List[Pet])
def listar_pets_do_cliente(id_cliente: int, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Lista pets de um cliente"""
    query = text("""
        SELECT id_pet, nome, especie, raca, sexo, peso, cor, microchip, castrado,
               observacoes, data_nascimento, id_cliente, ativo, created_at
        FROM pets
        WHERE id_cliente = :id_cliente AND ativo = TRUE AND deleted_at IS NULL
        ORDER BY nome
    """)
    result = db.execute(query, {"id_cliente": id_cliente}).fetchall()
    return [dict(row._mapping) for row in result]

@router.post("", response_model=Cliente, status_code=status.HTTP_201_CREATED)
def criar_cliente(cliente: ClienteCreate, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Cria novo cliente"""
    query = text("""
        INSERT INTO clientes (nome, cpf, telefone, email, endereco_rua, endereco_numero,
                              endereco_complemento, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep)
        VALUES (:nome, :cpf, :telefone, :email, :rua, :numero, :complemento, :bairro, :cidade, :estado, :cep)
    """)
    try:
        result = db.execute(query, {
            "nome": cliente.nome,
            "cpf": cliente.cpf,
            "telefone": cliente.telefone,
            "email": cliente.email,
            "rua": cliente.endereco_rua,
            "numero": cliente.endereco_numero,
            "complemento": cliente.endereco_complemento,
            "bairro": cliente.endereco_bairro,
            "cidade": cliente.endereco_cidade,
            "estado": cliente.endereco_estado,
            "cep": cliente.endereco_cep
        })
        db.commit()
        id_cliente = result.lastrowid
        
        # Retorna cliente criado
        return obter_cliente(id_cliente, db, current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar cliente: {str(e)}")

@router.put("/{id_cliente}", response_model=Cliente)
def atualizar_cliente(id_cliente: int, cliente: ClienteUpdate, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Atualiza dados do cliente"""
    # Verifica se existe
    existing = obter_cliente(id_cliente, db, current_user)
    
    # Monta update dinâmico apenas dos campos fornecidos
    updates = []
    params = {"id": id_cliente}
    
    if cliente.nome is not None:
        updates.append("nome = :nome")
        params["nome"] = cliente.nome
    if cliente.telefone is not None:
        updates.append("telefone = :telefone")
        params["telefone"] = cliente.telefone
    if cliente.email is not None:
        updates.append("email = :email")
        params["email"] = cliente.email
    if cliente.endereco_cidade is not None:
        updates.append("endereco_cidade = :cidade")
        params["cidade"] = cliente.endereco_cidade
    
    if not updates:
        return existing
    
    query = text(f"UPDATE clientes SET {', '.join(updates)} WHERE id_cliente = :id")
    try:
        db.execute(query, params)
        db.commit()
        return obter_cliente(id_cliente, db, current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar: {str(e)}")

@router.delete("/{id_cliente}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_cliente(id_cliente: int, db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Soft delete: marca cliente como inativo"""
    query = text("UPDATE clientes SET ativo = FALSE, deleted_at = NOW() WHERE id_cliente = :id")
    try:
        db.execute(query, {"id": id_cliente})
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao desativar: {str(e)}")


# ==================== Pacotes do Cliente ====================

@router.post("/{id_cliente}/pacotes", response_model=ClientePacoteDetalhado, status_code=201)
async def comprar_pacote(
    id_cliente: int,
    compra: ClientePacoteCreate,
    current_user: dict = Depends(get_current_user),
    x_empresa: str = Header(default="teste")
):
    """Registra compra de pacote para um cliente"""
    db = get_db_by_empresa(x_empresa)
    
    # Verificar se cliente existe
    check_cliente = db.execute(text("SELECT id_cliente FROM clientes WHERE id_cliente = :id"), {"id": id_cliente})
    if not check_cliente.fetchone():
        raise HTTPException(404, "Cliente não encontrado")
    
    # Buscar informações do pacote
    query_pacote = text("SELECT * FROM pacotes WHERE id_pacote = :id AND ativo = TRUE")
    pacote = db.execute(query_pacote, {"id": compra.id_pacote}).fetchone()
    
    if not pacote:
        raise HTTPException(404, "Pacote não encontrado ou inativo")
    
    # Calcular data de validade (se tipo créditos)
    data_validade = None
    usos_restantes = None
    
    if pacote.tipo == 'creditos':
        data_validade = datetime.now().date() + timedelta(days=pacote.validade_dias)
        usos_restantes = pacote.max_usos
    
    # Valor pago (usar preco_base se não informado)
    valor_pago = compra.valor_pago if compra.valor_pago else float(pacote.preco_base)
    
    # Inserir compra
    query_insert = text("""
        INSERT INTO clientes_pacotes 
        (id_cliente, id_pacote, data_validade, usos_restantes, status, valor_pago, observacoes)
        VALUES (:id_cliente, :id_pacote, :data_validade, :usos_restantes, 'ativo', :valor_pago, :observacoes)
    """)
    
    result = db.execute(query_insert, {
        "id_cliente": id_cliente,
        "id_pacote": compra.id_pacote,
        "data_validade": data_validade,
        "usos_restantes": usos_restantes,
        "valor_pago": valor_pago,
        "observacoes": compra.observacoes
    })
    db.commit()
    
    id_cliente_pacote = result.lastrowid
    
    # Buscar dados completos
    query_detalhado = text("""
        SELECT 
            cp.*,
            p.nome as pacote_nome,
            p.tipo as pacote_tipo,
            p.descricao as pacote_descricao
        FROM clientes_pacotes cp
        JOIN pacotes p ON cp.id_pacote = p.id_pacote
        WHERE cp.id_cliente_pacote = :id
    """)
    
    result = db.execute(query_detalhado, {"id": id_cliente_pacote})
    row = result.fetchone()
    
    response = dict(row._mapping)
    
    # Buscar serviços do pacote
    query_servicos = text("""
        SELECT s.id_servico, s.nome, s.preco_base, ps.quantidade
        FROM pacotes_servicos ps
        JOIN servicos s ON ps.id_servico = s.id_servico
        WHERE ps.id_pacote = :id_pacote
    """)
    servicos_result = db.execute(query_servicos, {"id_pacote": compra.id_pacote})
    servicos = [dict(row._mapping) for row in servicos_result.fetchall()]
    
    response['servicos'] = servicos
    
    return response


@router.get("/{id_cliente}/pacotes", response_model=List[ClientePacoteDetalhado])
async def listar_pacotes_cliente(
    id_cliente: int,
    status: str = None,  # Filtrar por status: ativo, usado, expirado
    current_user: dict = Depends(get_current_user),
    x_empresa: str = Header(default="teste")
):
    """Lista todos os pacotes comprados por um cliente"""
    db = get_db_by_empresa(x_empresa)
    
    query = """
        SELECT 
            cp.*,
            p.nome as pacote_nome,
            p.tipo as pacote_tipo,
            p.descricao as pacote_descricao
        FROM clientes_pacotes cp
        JOIN pacotes p ON cp.id_pacote = p.id_pacote
        WHERE cp.id_cliente = :id_cliente
    """
    params = {"id_cliente": id_cliente}
    
    if status:
        query += " AND cp.status = :status"
        params["status"] = status
    
    query += " ORDER BY cp.data_compra DESC"
    
    result = db.execute(text(query), params)
    rows = result.fetchall()
    
    pacotes = []
    for row in rows:
        pacote_dict = dict(row._mapping)
        
        # Buscar serviços
        query_servicos = text("""
            SELECT s.id_servico, s.nome, s.preco_base, ps.quantidade
            FROM pacotes_servicos ps
            JOIN servicos s ON ps.id_servico = s.id_servico
            WHERE ps.id_pacote = :id_pacote
        """)
        servicos_result = db.execute(query_servicos, {"id_pacote": pacote_dict['id_pacote']})
        servicos = [dict(row._mapping) for row in servicos_result.fetchall()]
        
        pacote_dict['servicos'] = servicos
        pacotes.append(pacote_dict)
    
    return pacotes
