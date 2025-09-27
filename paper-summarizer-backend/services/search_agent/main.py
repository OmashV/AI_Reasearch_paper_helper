# services/search_agent/main.py
import os
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import feedparser
from common.schemas import Paper, SearchRequest, SearchResponse
from common.config import settings
from common.utils import sanitize_text
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Search Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SEMANTIC_BASE = "https://api.semanticscholar.org/graph/v1"

async def call_semantic_scholar(query: str, limit: int=5):
    fields = "title,abstract,authors,year,url,externalIds"
    url = f"{SEMANTIC_BASE}/paper/search"
    params = {"query": query, "limit": limit, "fields": fields}
    headers = {}
    if settings.SEMANTIC_SCHOLAR_API_KEY:
        headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(url, params=params, headers=headers)
        r.raise_for_status()
        return r.json()

def parse_semantic_hit(hit) -> Paper:
    authors = [a.get("name") for a in hit.get("authors", [])]
    ext = hit.get("externalIds", {}) or {}
    arxiv_id = ext.get("ArXiv")
    return Paper(
        id=hit.get("paperId"),
        title=hit.get("title"),
        abstract=hit.get("abstract"),
        year=hit.get("year"),
        authors=authors,
        url=hit.get("url"),
        arxiv_id=arxiv_id,
        external_ids=ext
    )

def search_arxiv(query: str, max_results: int=5):
    q = f"all:{query}"
    url = f"http://export.arxiv.org/api/query?search_query={q}&start=0&max_results={max_results}"
    feed = feedparser.parse(url)
    papers = []
    for entry in feed.entries:
        authors = [a.name for a in entry.authors] if hasattr(entry, "authors") else []
        arxiv_id = entry.id.split('/abs/')[-1]
        abstract = entry.summary
        papers.append(Paper(
            id=arxiv_id,
            title=entry.title,
            abstract=abstract,
            year=int(entry.published[:4]),
            authors=authors,
            url=entry.link,
            arxiv_id=arxiv_id,
            external_ids={"ArXiv": arxiv_id}
        ))
    return papers

@app.post("/search", response_model=SearchResponse)
async def search(req: SearchRequest):
    q = sanitize_text(req.query)
    if not q:
        raise HTTPException(status_code=400, detail="Empty query")

    papers: List[Paper] = []

    # Try Semantic Scholar first
    try:
        data = await call_semantic_scholar(q, limit=req.limit)
        hits = data.get("data", [])
        for h in hits:
            try:
                papers.append(parse_semantic_hit(h))
            except Exception as e:
                print("Failed to parse hit:", e, h)
        if len(papers) >= 1:
            return SearchResponse(papers=papers)
    except httpx.HTTPError as e:
        print("Semantic Scholar API error:", e)

    # Fallback to arXiv
    try:
        papers += search_arxiv(q, max_results=req.limit)
    except Exception as e:
        print("arXiv search error:", e)

    # Always return a SearchResponse (can be empty)
    return SearchResponse(papers=papers)

