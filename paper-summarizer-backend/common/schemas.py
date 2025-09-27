from pydantic import BaseModel
from typing import List, Optional

class Paper(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    abstract: Optional[str] = None
    year: Optional[int] = None
    authors: Optional[List[str]] = []
    url: Optional[str] = None
    arxiv_id: Optional[str] = None
    external_ids: Optional[dict] = None

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

class SearchResponse(BaseModel):
    papers: List[Paper]

class SummarizeRequest(BaseModel):
    text: str
    style: Optional[str] = "abstractive"  # or "extractive"
    max_tokens: Optional[int] = 256

class SummarizeResponse(BaseModel):
    summary: str
    highlights: Optional[List[str]] = None

class CitationRequest(BaseModel):
    papers: List[Paper]

class CitationResponse(BaseModel):
    citations: List[dict]  # {paper_id, apa, bibtex}
