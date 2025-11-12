"""
Validadores centralizados para garantir segurança e consistência
"""
from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional
import re


class PaginationParams(BaseModel):
    """Parâmetros de paginação com validação"""
    skip: int = Field(default=0, ge=0, le=10000, description="Registros a pular")
    limit: int = Field(default=50, ge=1, le=100, description="Limite de registros (1-100)")


class LimitParam(BaseModel):
    """Parâmetro de limite genérico"""
    limit: int = Field(default=10, ge=1, le=100, description="Limite de resultados")


class IDParam(BaseModel):
    """Validação de ID"""
    id: int = Field(..., gt=0, description="ID deve ser positivo")


class PhoneNumber(BaseModel):
    """Validação de telefone brasileiro"""
    telefone: str = Field(..., min_length=10, max_length=15)
    
    @field_validator('telefone')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Remove caracteres não numéricos
        cleaned = re.sub(r'\D', '', v)
        if len(cleaned) not in [10, 11]:
            raise ValueError('Telefone deve ter 10 ou 11 dígitos')
        return v


class CPFValidator(BaseModel):
    """Validação de CPF"""
    cpf: str = Field(..., min_length=11, max_length=14)
    
    @field_validator('cpf')
    @classmethod
    def validate_cpf(cls, v: str) -> str:
        # Remove caracteres não numéricos
        cpf = re.sub(r'\D', '', v)
        
        if len(cpf) != 11:
            raise ValueError('CPF deve ter 11 dígitos')
        
        # Verifica se todos os dígitos são iguais
        if cpf == cpf[0] * 11:
            raise ValueError('CPF inválido')
        
        # Validação dos dígitos verificadores
        def calc_digit(cpf_partial: str, peso: int) -> str:
            soma = sum(int(cpf_partial[i]) * (peso - i) for i in range(len(cpf_partial)))
            resto = soma % 11
            return '0' if resto < 2 else str(11 - resto)
        
        if cpf[9] != calc_digit(cpf[:9], 10) or cpf[10] != calc_digit(cpf[:10], 11):
            raise ValueError('CPF inválido')
        
        return v


class PasswordStrength(BaseModel):
    """Validação de força de senha"""
    senha: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('senha')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Senha deve ter no mínimo 8 caracteres')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Senha deve conter ao menos uma letra maiúscula')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Senha deve conter ao menos uma letra minúscula')
        
        if not re.search(r'\d', v):
            raise ValueError('Senha deve conter ao menos um número')
        
        # Opcional: caractere especial
        # if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
        #     raise ValueError('Senha deve conter ao menos um caractere especial')
        
        return v


class EmailValidator(BaseModel):
    """Validação de email"""
    email: EmailStr


class DateRangeValidator(BaseModel):
    """Validação de range de datas"""
    data_inicio: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    data_fim: Optional[str] = Field(None, pattern=r'^\d{4}-\d{2}-\d{2}$')
    
    @field_validator('data_fim')
    @classmethod
    def validate_date_range(cls, v, info):
        if v and info.data.get('data_inicio'):
            if v < info.data['data_inicio']:
                raise ValueError('data_fim deve ser maior ou igual a data_inicio')
        return v


class PriceValidator(BaseModel):
    """Validação de preços"""
    preco: float = Field(..., gt=0, le=999999.99, description="Preço deve ser positivo")


class PercentageValidator(BaseModel):
    """Validação de percentuais"""
    percentual: float = Field(..., ge=0, le=100, description="Percentual entre 0 e 100")


class QuantityValidator(BaseModel):
    """Validação de quantidade"""
    quantidade: int = Field(..., ge=1, le=10000, description="Quantidade entre 1 e 10000")


# Função helper para sanitizar SQL
def sanitize_sql_input(value: str) -> str:
    """
    Remove caracteres perigosos de inputs SQL
    Nota: Sempre use queries parametrizadas, isso é apenas uma camada extra
    """
    dangerous_chars = [';', '--', '/*', '*/', 'xp_', 'sp_', 'DROP', 'DELETE', 'INSERT', 'UPDATE', 'EXEC']
    value_upper = value.upper()
    
    for char in dangerous_chars:
        if char in value_upper:
            raise ValueError(f'Caractere ou comando não permitido: {char}')
    
    return value


# Função helper para validar tipo de arquivo
def validate_file_extension(filename: str, allowed_extensions: set) -> bool:
    """Valida extensão de arquivo"""
    import os
    ext = os.path.splitext(filename)[1].lower()
    return ext in allowed_extensions
