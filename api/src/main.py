from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from datetime import datetime, timezone

from src.config import get_settings
from src.database import get_engine_for_empresa
from src.routes import auth, clientes, vendas, agendamentos, kpis, produtos, servicos, pacotes, empresas
from src.logger import setup_logger, mask_sensitive_data
from src.middleware import (
    SecurityHeadersMiddleware,
    RequestLoggingMiddleware,
    RequestSizeLimitMiddleware,
    SQLInjectionProtectionMiddleware,
    TimeoutMiddleware
)

settings = get_settings()
logger = setup_logger(__name__)

# Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia lifecycle da aplicação"""
    # Startup
    logger.info("🚀 Petshop API iniciando...", extra={
        "database": mask_sensitive_data(settings.database_url),
        "environment": "production" if not settings.debug else "development"
    })
    yield
    # Shutdown
    logger.info("👋 Petshop API encerrando...")

app = FastAPI(
    title="Petshop API",
    description="API REST para gestão completa de petshop com integração ao banco MySQL",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,  # Desabilita docs em produção
    redoc_url="/redoc" if settings.debug else None,
)

# Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middlewares de Segurança (ordem importa!)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_size_mb=10)
app.add_middleware(SQLInjectionProtectionMiddleware)
app.add_middleware(TimeoutMiddleware, timeout_seconds=30)

# CORS - Configuração mais restritiva
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Empresa",
        "Accept",
        "Origin",
        "User-Agent",
    ],
    expose_headers=["Content-Length", "X-Total-Count"],
    max_age=600,  # Cache preflight por 10 minutos
)

# Rotas
app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(vendas.router)
app.include_router(agendamentos.router)
app.include_router(kpis.router)
app.include_router(produtos.router)
app.include_router(servicos.router)
app.include_router(pacotes.router)
app.include_router(empresas.router)

@app.get("/")
@limiter.limit("10/minute")
def root(request: Request):
    """Health check básico"""
    return {
        "status": "ok",
        "service": "Petshop API",
        "version": "2.0.0",
        "database_version": 13,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "features": [
            "multi-database",
            "jwt-auth",
            "rate-limiting",
            "structured-logging",
            "security-headers",
            "procedures",
            "kpis",
            "pacotes",
            "calendario-agendamentos"
        ],
        "docs": "/docs" if settings.debug else "disabled in production"
    }

@app.get("/health")
@limiter.limit("30/minute")
def health_check(request: Request):
    """Health check completo com status de todos os serviços"""
    from sqlalchemy import text
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {}
    }
    
    # Check Database
    try:
        engine = get_engine_for_empresa(None)
        with engine.connect() as conn:
            start = datetime.now(timezone.utc)
            conn.execute(text("SELECT 1")).scalar()
            latency_ms = (datetime.now(timezone.utc) - start).total_seconds() * 1000
            
            health_status["checks"]["database"] = {
                "status": "up",
                "latency_ms": round(latency_ms, 2)
            }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "down",
            "error": str(e)
        }
    
    # Check API
    health_status["checks"]["api"] = {
        "status": "up",
        "version": "2.0.0"
    }
    
    # Status code baseado no resultado
    status_code = 200 if health_status["status"] == "healthy" else 503
    
    return JSONResponse(content=health_status, status_code=status_code)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
