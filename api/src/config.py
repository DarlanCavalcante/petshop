from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False
    cors_origins: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validar SECRET_KEY
        weak_keys = [
            'sua-chave-secreta-super-segura-mude-isso-em-producao',
            'mudar-em-producao-gerar-com-openssl-rand-hex-32',
            'secret',
            'changeme'
        ]
        if self.secret_key.lower() in weak_keys or len(self.secret_key) < 32:
            raise ValueError(
                "⚠️ ERRO DE SEGURANÇA: SECRET_KEY inválida!\n"
                "Gere uma chave segura com:\n"
                "  openssl rand -hex 32\n"
                "  ou PowerShell: [Convert]::ToBase64String([byte[]](1..32|%{Get-Random -Max 256}))"
            )

    @property
    def cors_origins_list(self) -> list:
        return [origin.strip() for origin in self.cors_origins.split(",")]

@lru_cache()
def get_settings():
    return Settings()
