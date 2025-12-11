"""
Middleware de segurança para proteção adicional
"""
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import time
from src.logger import setup_logger, log_request, log_security_event

logger = setup_logger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adiciona headers de segurança em todas as respostas"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Security Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Remove header que expõe tecnologia
        if "Server" in response.headers:
            del response.headers["Server"]
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Loga todas as requisições HTTP"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Pega informações da requisição
        method = request.method
        path = request.url.path
        
        try:
            response = await call_next(request)
            
            # Calcula duração
            duration_ms = (time.time() - start_time) * 1000
            
            # Extrai user_id se disponível
            user_id = None
            if hasattr(request.state, "user"):
                user_id = getattr(request.state.user, "id", None)
            
            # Loga requisição
            log_request(
                logger=logger,
                method=method,
                path=path,
                status_code=response.status_code,
                duration_ms=duration_ms,
                user_id=user_id
            )
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            
            logger.error(
                f"Request failed: {method} {path}",
                extra={
                    "error": str(e),
                    "duration_ms": duration_ms,
                    "event_type": "request_error"
                }
            )
            raise


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """
    Middleware para whitelist de IPs (opcional)
    Útil para endpoints administrativos
    """

    def __init__(self, app, allowed_ips: list = None):
        super().__init__(app)
        self.allowed_ips = set(allowed_ips or [])  # Usa set para lookup O(1)
        self.enabled = len(self.allowed_ips) > 0
        self._ip_cache = {}  # Cache simples para IPs verificados
        self._cache_ttl = 300  # 5 minutos

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.enabled:
            return await call_next(request)

        # Pega IP do cliente
        client_ip = request.client.host

        # Verifica cache primeiro
        current_time = time.time()
        if client_ip in self._ip_cache:
            cached_result, cache_time = self._ip_cache[client_ip]
            if current_time - cache_time < self._cache_ttl:
                if not cached_result:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="IP não autorizado"
                    )
                return await call_next(request)

        # Verifica whitelist
        allowed = client_ip in self.allowed_ips

        # Atualiza cache
        self._ip_cache[client_ip] = (allowed, current_time)

        if not allowed:
            logger.warning(
                f"IP bloqueado tentou acessar: {client_ip}",
                extra={
                    "ip": client_ip,
                    "path": request.url.path,
                    "event_type": "ip_blocked"
                }
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="IP não autorizado"
            )

        return await call_next(request)
        if client_ip not in self.allowed_ips:
            log_security_event(
                logger=logger,
                event_type="ip_blocked",
                description=f"Access denied from IP {client_ip}",
                severity="WARNING",
                ip_address=client_ip
            )
            
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Access forbidden"}
            )
        
        return await call_next(request)


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Limita tamanho das requisições para prevenir DoS"""
    
    def __init__(self, app, max_size_mb: float = 10):
        super().__init__(app)
        self.max_size_bytes = max_size_mb * 1024 * 1024
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Verifica Content-Length header
        content_length = request.headers.get("content-length")
        
        if content_length and int(content_length) > self.max_size_bytes:
            log_security_event(
                logger=logger,
                event_type="request_too_large",
                description=f"Request size {content_length} exceeds limit {self.max_size_bytes}",
                severity="WARNING",
                ip_address=request.client.host
            )
            
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"detail": f"Request size exceeds {self.max_size_bytes / 1024 / 1024}MB limit"}
            )
        
        return await call_next(request)


class SQLInjectionProtectionMiddleware(BaseHTTPMiddleware):
    """
    Detecta tentativas básicas de SQL Injection em query parameters
    Nota: Não substitui queries parametrizadas, é apenas uma camada extra
    """
    
    SUSPICIOUS_PATTERNS = [
        "union", "select", "insert", "update", "delete", "drop",
        "exec", "execute", "script", "javascript", "--", "/*", "*/",
        "xp_", "sp_", "0x", "char(", "chr(", "ascii(", "||", "&&"
    ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Verifica query parameters
        for key, value in request.query_params.items():
            value_lower = str(value).lower()
            
            for pattern in self.SUSPICIOUS_PATTERNS:
                if pattern in value_lower:
                    log_security_event(
                        logger=logger,
                        event_type="sql_injection_attempt",
                        description=f"Suspicious pattern '{pattern}' in parameter '{key}'",
                        severity="ERROR",
                        ip_address=request.client.host
                    )
                    
                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={"detail": "Invalid request parameters"}
                    )
        
        return await call_next(request)


class TimeoutMiddleware(BaseHTTPMiddleware):
    """Adiciona timeout para requisições"""
    
    def __init__(self, app, timeout_seconds: int = 30):
        super().__init__(app)
        self.timeout_seconds = timeout_seconds
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        import asyncio
        
        try:
            return await asyncio.wait_for(
                call_next(request),
                timeout=self.timeout_seconds
            )
        except asyncio.TimeoutError:
            log_security_event(
                logger=logger,
                event_type="request_timeout",
                description=f"Request exceeded {self.timeout_seconds}s timeout",
                severity="WARNING",
                ip_address=request.client.host
            )
            
            return JSONResponse(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                content={"detail": "Request timeout"}
            )
