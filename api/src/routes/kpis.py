from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.routes.auth import get_current_user_id

router = APIRouter(prefix="/kpis", tags=["KPIs e Relatórios"])

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: int = Depends(get_current_user_id)):
    """Dashboard com KPIs principais"""
    return {"message": "Dashboard funcionando"}

@router.get("/test")
def test_route():
    """Rota de teste"""
    return {"test": "ok"}
