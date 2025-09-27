from passlib.context import CryptContext
import jwt, time
from common.config import settings
from sqlmodel import Session
from .db import engine
from .models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_EXP = 60*60*24*7  # 7 days

def hash_password(pw: str) -> str:
    return pwd_context.hash(pw)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: int, email: str):
    payload = {"sub": str(user_id), "email": email, "exp": int(time.time()) + JWT_EXP}
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    return token

def get_current_user_from_token(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        user_id = int(payload.get("sub"))
        with Session(engine) as s:
            user = s.get(User, user_id)
            return user
    except Exception:
        return None
