from sqlmodel import SQLModel, create_engine, Session
from common.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False)

def init_db():
    SQLModel.metadata.create_all(engine)
