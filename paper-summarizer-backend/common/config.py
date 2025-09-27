# common/config.py
from pydantic_settings import BaseSettings
from pydantic import Field  # optional, for defaults/validation

class Settings(BaseSettings):
    SEMANTIC_SCHOLAR_API_KEY: str | None
    HUGGINGFACE_API_KEY: str | None
    HUGGINGFACE_MODEL: str = "meta-llama/Llama-2-7b-chat-hf"
    JWT_SECRET: str
    DATABASE_URL: str = "sqlite:///./orchestrator.db"
    FERNET_KEY: str | None = Field(None, env="FERNET_KEY")

    class Config:
        env_file = ".env"

settings = Settings()
