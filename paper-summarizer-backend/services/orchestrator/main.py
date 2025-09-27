import os
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlmodel
from sqlmodel import Session
from .db import engine, init_db
from .models import User
from .auth import hash_password, verify_password, create_access_token, get_current_user_from_token
from common.schemas import SearchRequest, SearchResponse, SummarizeRequest, SummarizeResponse, CitationRequest, CitationResponse, Paper
import httpx
from common.utils import sanitize_text

app = FastAPI(title="Orchestrator / Crew API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

SEARCH_AGENT = os.environ.get("SEARCH_AGENT_URL", "http://localhost:8001")
SUMMARIZER_AGENT = os.environ.get("SUMMARIZER_AGENT_URL", "http://localhost:8002")
CITATION_AGENT = os.environ.get("CITATION_AGENT_URL", "http://localhost:8003")

class RegisterPayload(BaseModel):
    email: str
    password: str

class LoginPayload(BaseModel):
    email: str
    password: str

@app.post("/auth/register")
def register(payload: RegisterPayload):
    with Session(engine) as s:
        user = s.exec(sqlmodel.select(User).where(User.email == payload.email)).first()
        if user:
            raise HTTPException(status_code=400, detail="Email exists")
        u = User(email=payload.email, hashed_password=hash_password(payload.password))
        s.add(u)
        s.commit()
        s.refresh(u)
        token = create_access_token(u.id, u.email)
        return {"id": u.id, "email": u.email, "access_token": token}

@app.post("/auth/login")
def login(payload: LoginPayload):
    with Session(engine) as s:
        statement = sqlmodel.select(User).where(User.email == payload.email)
        result = s.exec(statement).first()
        if not result or not verify_password(payload.password, result.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid creds")
        token = create_access_token(result.id, result.email)
        return {"access_token": token}

def get_current_user(authorization: str | None = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization.split(" ", 1)[1]
    user = get_current_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@app.post("/api/chat")
async def chat(payload: SearchRequest, user=Depends(get_current_user)):
    q = sanitize_text(payload.query)
    if not q:
        raise HTTPException(status_code=400, detail="Empty query")

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(f"{SEARCH_AGENT}/search", json={"query": q, "limit": payload.limit})
        r.raise_for_status()
        search_resp = r.json()
        papers = [Paper(**p) for p in search_resp.get("papers", [])]

        summaries = []
        async def summarize_paper(p: Paper):
            text = p.abstract or ""
            if not text:
                return {"paper_id": p.id, "summary": ""}
            sr = {"text": text, "style": "abstractive", "max_tokens": 256}
            r2 = await client.post(f"{SUMMARIZER_AGENT}/summarize", json=sr)
            r2.raise_for_status()
            sdata = r2.json()
            return {"paper_id": p.id, "summary": sdata.get("summary", ""), "highlights": sdata.get("highlights", [])}

        tasks = [summarize_paper(p) for p in papers]
        import asyncio
        summaries = await asyncio.gather(*tasks)

        r3 = await client.post(f"{CITATION_AGENT}/cite", json={"papers": [p.dict() for p in papers]})
        r3.raise_for_status()
        citations = r3.json()

    return {
        "query": q,
        "papers": [p.dict() for p in papers],
        "summaries": summaries,
        "citations": citations.get("citations", [])
    }