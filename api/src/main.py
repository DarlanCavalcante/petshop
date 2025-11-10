from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.config import get_settings
from src.database import get_engine_for_empresa
from src.routes import auth, clientes, vendas, agendamentos, kpis, produtos, servicos

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia lifecycle da aplicação"""
    # Startup
    print("🚀 Petshop API iniciando...")
    print(f"📊 Banco de dados: {settings.database_url.split('@')[1]}")
    yield
    # Shutdown
    print("👋 Petshop API encerrando...")

app = FastAPI(
    title="Petshop API",
    description="API REST para gestão completa de petshop com integração ao banco MySQL",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(vendas.router)
app.include_router(agendamentos.router)
app.include_router(kpis.router)
app.include_router(produtos.router)
app.include_router(servicos.router)

@app.get("/")
def root():
    """Health check"""
    return {
        "status": "ok",
        "service": "Petshop API",
        "version": "1.1.0",
        "database_version": 11,
        "features": ["multi-database", "jwt-auth", "procedures", "kpis"],
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Verifica conectividade com o banco"""
    try:
        from sqlalchemy import text
        engine = get_engine_for_empresa(None)  # engine do banco default
        with engine.connect() as conn:
            _ = conn.execute(text("SELECT 1")).scalar()
            return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
