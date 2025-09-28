from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from common.schemas import SummarizeRequest, SummarizeResponse
from transformers import pipeline

app = FastAPI(title="Summarizer Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load BART model
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    try:
        # Generate summary
        summary = summarizer(req.text, max_length=req.max_tokens, min_length=30, do_sample=False)[0]["summary_text"]
        
        # Generate highlights (simple heuristic or model-based)
        # For simplicity, split summary into sentences and take first 3 as highlights
        sentences = summary.split(". ")
        highlights = [s.strip() + "." for s in sentences[:3] if s.strip()]
        
        return SummarizeResponse(summary=summary, highlights=highlights)
    except Exception as e:
        return SummarizeResponse(summary="", highlights=[], error=str(e))