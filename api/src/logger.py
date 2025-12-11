"""
Sistema de logging estruturado para produção
"""
import logging
import sys
from pythonjsonlogger import jsonlogger
from datetime import datetime
from typing import Optional


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Formatter JSON personalizado com campos adicionais"""
    
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        
        # Adiciona timestamp ISO 8601
        log_record['timestamp'] = datetime.utcnow().isoformat()
        
        # Adiciona nível de log
        log_record['level'] = record.levelname
        
        # Adiciona módulo e função
        log_record['module'] = record.module
        log_record['function'] = record.funcName
        
        # Adiciona linha do código
        log_record['line'] = record.lineno


def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    """
    Configura logger com formato JSON estruturado
    
    Args:
        name: Nome do logger (geralmente __name__)
        level: Nível de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    
    Returns:
        Logger configurado
    """
    logger = logging.getLogger(name)
    
    # Evita duplicação de handlers
    if logger.handlers:
        return logger
    
    # Define nível
    logger.setLevel(getattr(logging, level.upper()))
    
    # Handler para stdout (JSON em produção)
    handler = logging.StreamHandler(sys.stdout)
    
    # Formato JSON
    formatter = CustomJsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    # Não propaga para o root logger
    logger.propagate = False
    
    return logger


def mask_sensitive_data(data: str) -> str:
    """
    Mascara dados sensíveis antes de logar
    
    Args:
        data: String contendo dados potencialmente sensíveis
    
    Returns:
        String com dados mascarados
    """
    import re
    
    # Mascara senhas em URLs
    data = re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', data)
    
    # Mascara tokens Bearer
    data = re.sub(r'Bearer\s+[\w\-\.]+', 'Bearer ****', data)
    
    # Mascara CPF (mantém 3 primeiros dígitos)
    data = re.sub(r'\b(\d{3})\.\d{3}\.\d{3}-\d{2}\b', r'\1.***.***-**', data)
    
    # Mascara emails (mantém domínio)
    data = re.sub(r'\b[\w\.-]+@([\w\.-]+)\b', r'****@\1', data)
    
    # Mascara números de cartão de crédito
    data = re.sub(r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b', '****-****-****-****', data)
    
    return data


def log_request(logger: logging.Logger, method: str, path: str, 
                status_code: int, duration_ms: float, user_id: Optional[int] = None):
    """
    Loga requisição HTTP de forma estruturada
    
    Args:
        logger: Logger configurado
        method: Método HTTP (GET, POST, etc)
        path: Caminho da requisição
        status_code: Código de status HTTP
        duration_ms: Duração da requisição em milissegundos
        user_id: ID do usuário (se autenticado)
    """
    logger.info(
        "HTTP Request",
        extra={
            "http_method": method,
            "http_path": path,
            "http_status": status_code,
            "duration_ms": duration_ms,
            "user_id": user_id,
            "event_type": "http_request"
        }
    )


def log_database_query(logger: logging.Logger, query: str, duration_ms: float, 
                       rows_affected: Optional[int] = None):
    """
    Loga query de banco de dados
    
    Args:
        logger: Logger configurado
        query: Query SQL (será mascarada)
        duration_ms: Duração da query em milissegundos
        rows_affected: Número de linhas afetadas
    """
    # Trunca query se muito longa
    query_preview = query[:200] + "..." if len(query) > 200 else query
    
    logger.info(
        "Database Query",
        extra={
            "query": query_preview,
            "duration_ms": duration_ms,
            "rows_affected": rows_affected,
            "event_type": "db_query"
        }
    )


def log_security_event(logger: logging.Logger, event_type: str, 
                       description: str, severity: str = "WARNING",
                       user_id: Optional[int] = None, ip_address: Optional[str] = None):
    """
    Loga evento de segurança
    
    Args:
        logger: Logger configurado
        event_type: Tipo de evento (login_failed, unauthorized_access, etc)
        description: Descrição do evento
        severity: Severidade (INFO, WARNING, ERROR, CRITICAL)
        user_id: ID do usuário relacionado
        ip_address: IP de origem
    """
    log_method = getattr(logger, severity.lower())
    
    log_method(
        "Security Event",
        extra={
            "security_event_type": event_type,
            "description": description,
            "user_id": user_id,
            "ip_address": ip_address,
            "event_type": "security"
        }
    )


def log_business_event(logger: logging.Logger, event_type: str, 
                       description: str, metadata: dict = None):
    """
    Loga evento de negócio importante
    
    Args:
        logger: Logger configurado
        event_type: Tipo de evento (venda_realizada, agendamento_criado, etc)
        description: Descrição do evento
        metadata: Dados adicionais do evento
    """
    extra = {
        "business_event_type": event_type,
        "description": description,
        "event_type": "business"
    }
    
    if metadata:
        extra.update(metadata)
    
    logger.info("Business Event", extra=extra)
