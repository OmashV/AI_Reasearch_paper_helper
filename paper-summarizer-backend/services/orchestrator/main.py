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
from common.config import settings  # Load settings

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

async def call_cosmos_rp(messages: list, max_tokens: int = 512):
    """
    Call Cosmos RP API for conversational response.
    messages: List of {"role": "system/user/assistant", "content": "..."}
    """
    if not settings.COSMO_RP_URL or not settings.COSMO_RP_KEY:
        raise HTTPException(status_code=500, detail="Cosmos RP API not configured")
    
    headers = {
        "Authorization": f"Bearer {settings.COSMO_RP_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "cosmosrp",
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7,  
        "top_p": 0.9,
    }
    
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            response = await client.post(settings.COSMO_RP_URL, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Cosmos RP API error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cosmos RP API failed: {str(e)}")

@app.post("/api/chat")
async def chat(payload: SearchRequest, user=Depends(get_current_user)):
    q = sanitize_text(payload.query)
    if not q:
        raise HTTPException(status_code=400, detail="Empty query")

    async with httpx.AsyncClient(timeout=60) as client:
        # 1) Search
        r = await client.post(f"{SEARCH_AGENT}/search", json={"query": q, "limit": payload.limit})
        r.raise_for_status()
        search_resp = r.json()
        papers = [Paper(**p) for p in search_resp.get("papers", [])]

        # 2) Summarize top-N (parallel)
        summaries = []
        async def summarize_paper(p: Paper):
            text = p.abstract or ""
            if not text:
                return {"paper_id": p.id, "summary": "", "highlights": []}
            sr = {"text": text, "style": "abstractive", "max_tokens": 256}
            r2 = await client.post(f"{SUMMARIZER_AGENT}/summarize", json=sr)
            r2.raise_for_status()
            sdata = r2.json()
            return {
                "paper_id": p.id,
                "summary": sdata.get("summary", ""),
                "highlights": sdata.get("highlights", []) if isinstance(sdata.get("highlights"), list) else []
            }

        tasks = [summarize_paper(p) for p in papers]
        import asyncio
        summaries = await asyncio.gather(*tasks)

        # 3) Citations
        r3 = await client.post(f"{CITATION_AGENT}/cite", json={"papers": [p.dict() for p in papers]})
        r3.raise_for_status()
        citations = r3.json()

    # 4) Generate conversational response with Cosmos RP
    messages = [
        {
            "role": "system",
            "content": (
                "You are a helpful assistant. "
                "Provide clear, accurate, and concise responses in a professional yet friendly manner. "
                "Keep your tone polite, approachable, and supportive while focusing on delivering useful information.\n\n"

                "# Emoji policy for responses:\n"
                "1. Include 0–3 small, relevant emojis per response to improve readability and friendliness — "
                "do not add more than three. Use emojis sparingly and only when they add clarity or warmth.\n"
                "2. Choose emojis that match the content: e.g. 🔍 for research/questions, 📄 for papers/documents, "
                "💡 for suggestions/ideas, ✅ for confirmations/success, ⚠️ for warnings, 🔗 for links, 📚 for references, 👍 for encouragement.\n"
                "3. Place emojis inline near the sentence they relate to (not a whole block of emojis at the end). "
                "Avoid using emojis in a way that reduces professionalism.\n"
                "4. Do not use emojis for sensitive topics (medical, legal, personal health, finances) unless explicitly asked; "
                "when used with sensitive topics, prefer neutral and cautious emojis (e.g. ⚠️) and include a clear, professional note.\n"
                "5. If summarizing a list of papers, prefix each paper title/summary line with an appropriate emoji like 📄 or 📚.\n\n"

                "Keep responses concise and include emojis naturally — not as decoration. Avoid any emojis that could be interpreted as unprofessional."
            )
        },
        {
            "role": "user",
            "content": (
                f"Query: {q}\n"
                f"Found {len(papers)} papers:\n"
                f"Summaries: {summaries}"
            )
        }
    ]
    chat_response = await call_cosmos_rp(messages, max_tokens=512)


    return {
        "query": q,
        "papers": [p.dict() for p in papers],
        "summaries": summaries,
        "citations": citations.get("citations", []),
        "chat_response": chat_response  
    }