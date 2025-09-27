# services/citation_agent/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from common.schemas import CitationRequest, CitationResponse, Paper
from typing import List

app = FastAPI(title="Citation Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def authors_to_apa(authors: List[str]):
    if not authors:
        return ""
    # simple: Last, F. ; take up to 3 authors then "et al."
    def conv(name):
        parts = name.split()
        last = parts[-1]
        initials = " ".join([p[0]+'.' for p in parts[:-1]]) if len(parts) > 1 else ""
        return f"{last}, {initials}".strip()
    if len(authors) <= 3:
        return ", ".join(conv(a) for a in authors)
    else:
        return ", ".join(conv(a) for a in authors[:3]) + ", et al."

def make_bibtex(paper: Paper):
    key = (paper.arxiv_id or paper.id or "paper").replace("/", "_")
    authors = " and ".join(paper.authors or ["Unknown"])
    entry = f"@article{{{key},\n  title={{ {paper.title} }},\n  author={{ {authors} }},\n  year={{ {paper.year or ''} }},\n  url={{ {paper.url or ''} }}\n}}"
    return entry

@app.post("/cite", response_model=CitationResponse)
async def cite(req: CitationRequest):
    out = []
    for p in req.papers:
        apa_auth = authors_to_apa(p.authors or [])
        apa = f"{apa_auth} ({p.year or ''}). {p.title}. {p.url or ''}"
        bib = make_bibtex(p)
        out.append({"paper_id": p.id, "apa": apa, "bibtex": bib})
    return CitationResponse(citations=out)
