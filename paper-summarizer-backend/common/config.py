from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    SEMANTIC_SCHOLAR_API_KEY: str | None
    HUGGINGFACE_API_KEY: str | None
    HUGGINGFACE_MODEL: str = "meta-llama/Llama-2-7b-chat-hf"
    JWT_SECRET: str
    DATABASE_URL: str = "sqlite:///./orchestrator.db"
    FERNET_KEY: str | None = Field(None, env="FERNET_KEY")
    COSMO_RP_URL: str
    COSMO_RP_KEY: str
    SEARCH_AGENT_URL: str = "http://localhost:8001"
    SUMMARIZER_AGENT_URL: str = "http://localhost:8002"
    CITATION_AGENT_URL: str = "http://localhost:8003"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()