from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from src.database import get_db
from src.routes.auth import get_current_user_id

router = APIRouter(prefix="/kpis", tags=["KPIs e Relatórios"])

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Dashboard com KPIs principais"""
    return {"message": "Dashboard funcionando"}

@router.get("/receita-diaria")
def receita_diaria(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Receita diária dos últimos 7 dias"""
    # Dados de exemplo - implementar lógica real depois
    today = datetime.now()
    data = []
    for i in range(7):
        date = today - timedelta(days=i)
        data.append({
            "data": date.strftime("%Y-%m-%d"),
            "receita": 1500 + (i * 200)  # Valores de exemplo
        })
    return data[::-1]  # Retornar em ordem cronológica

@router.get("/produtos-mais-vendidos")
def produtos_mais_vendidos(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Produtos mais vendidos"""
    # Dados de exemplo - implementar lógica real depois
    return [
        {"nome": "Ração Premium", "vendas": 45},
        {"nome": "Shampoo Pet", "vendas": 32},
        {"nome": "Brinquedo", "vendas": 28},
        {"nome": "Antipulgas", "vendas": 25},
        {"nome": "Cama Pet", "vendas": 18}
    ]

@router.get("/test")
def test_route():
    """Rota de teste"""
    return {"test": "ok"}
