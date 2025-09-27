import os
import logging
import asyncio
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# use your existing schemas
from common.schemas import SummarizeRequest, SummarizeResponse
from common.utils import sanitize_text

# transformers
from transformers import pipeline, Pipeline, AutoTokenizer, AutoModelForSeq2SeqLM

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Summarizer Agent (local transformers)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration: updated to use facebook/bart-large-cnn
MODEL_NAME = os.getenv("SUMMARIZER_MODEL", "facebook/bart-large-cnn")
# maximum characters from input text we will send to the model (to avoid OOM/very long runs)
INPUT_CHAR_LIMIT = int(os.getenv("SUMMARIZER_INPUT_CHAR_LIMIT", "5000"))
# default token mapping: pipeline uses max_length (tokens)
DEFAULT_MAX_LENGTH = 200
DEFAULT_MIN_LENGTH = 50
# Safety bounds for transformer token lengths
MAX_MAX_LENGTH = 512
MIN_MIN_LENGTH = 10

# Global pipeline variable (loaded at import/startup)
summarizer: Pipeline | None = None


def load_model():
    """
    Load the summarization model and tokenizer into the global `summarizer`.
    This runs synchronously at startup; it can take time depending on the model and hardware.
    """
    global summarizer
    if summarizer is not None:
        return

    logger.info("Loading summarization model: %s", MODEL_NAME)
    try:
        # For seq2seq summarization pipelines, prefer model + tokenizer together
        # It will use CPU if CUDA not available. Users can set environment variables / install CUDA for GPU use.
        summarizer = pipeline("summarization", model=MODEL_NAME, device=0 if (os.getenv("USE_CUDA","0")=="1") else -1)
        logger.info("Summarization model loaded successfully.")
    except Exception as e:
        logger.exception("Failed to load summarization model: %s", e)
        summarizer = None
        # Do not raise here — allow the app to start; endpoint will return 503 if model absent.


# load model at startup (synchronous)
load_model()


def _truncate_text(text: str, char_limit: int) -> (str, bool):
    """
    Truncate text to char_limit characters. Returns (truncated_text, was_truncated).
    """
    if len(text) <= char_limit:
        return text, False
    return text[:char_limit] + " ...", True


def _extract_highlights(summary_text: str, max_highlights: int = 3) -> List[str]:
    """
    Produce simple highlights by splitting summary into sentences and returning top N.
    This is a heuristic, you can replace this with a more advanced method later.
    """
    # naive sentence split on periods; keep non-empty fragments
    parts = [s.strip() for s in summary_text.replace("\n", " ").split(".") if s.strip()]
    # return first few meaningful fragments as highlights
    highlights = []
    for p in parts:
        if len(p) > 10:
            highlights.append(p if p.endswith(".") else p + ".")
        if len(highlights) >= max_highlights:
            break
    return highlights


async def _run_summarizer(text: str, max_length: int, min_length: int) -> str:
    """
    Run the summarizer pipeline in a thread to avoid blocking the event loop.
    Returns the generated summary string.
    """
    global summarizer
    if summarizer is None:
        raise RuntimeError("Summarization model is not loaded.")

    # Use asyncio.to_thread to run CPU-bound pipeline call off the event loop
    def _sync_call():
        # The pipeline returns a list of dicts [{'summary_text': ...}]
        # In case of long text, the pipeline may still raise; keep this call simple.
        out = summarizer(
            text,
            max_length=max_length,
            min_length=min_length,
            do_sample=False,
        )
        if isinstance(out, list) and len(out) > 0 and "summary_text" in out[0]:
            return out[0]["summary_text"]
        # fallback: str(out)
        return str(out)

    summary_text = await asyncio.to_thread(_sync_call)
    return summary_text


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    """
    Summarize endpoint compatible with previous interface.
    Uses a local transformers pipeline (loaded from MODEL_NAME).
    """
    # sanitize input
    text = sanitize_text(req.text)
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")

    # ensure model is available
    if summarizer is None:
        logger.error("Summarization model is not available.")
        raise HTTPException(status_code=503, detail="Summarization model not loaded on server")

    # truncate very long inputs (you can remove/raise depending on desired behavior)
    processed_text, was_truncated = _truncate_text(text, INPUT_CHAR_LIMIT)

    # map req.max_tokens -> pipeline max_length/min_length
    # if user didn't provide, use defaults
    user_max = int(req.max_tokens) if getattr(req, "max_tokens", None) else DEFAULT_MAX_LENGTH
    # clamp to safe bounds
    max_length = min(max(1, user_max), MAX_MAX_LENGTH)
    min_length = min(max(MIN_MIN_LENGTH, int(DEFAULT_MIN_LENGTH)), max_length)

    try:
        # run summarizer in background thread
        summary_text = await _run_summarizer(processed_text, max_length=max_length, min_length=min_length)
    except Exception as e:
        logger.exception("Error while running summarizer: %s", e)
        raise HTTPException(status_code=500, detail="Local summarizer failed")

    # optionally append truncated warning
    if was_truncated:
        summary_text = summary_text.strip() + "\n\n(Note: input was truncated for processing.)"

    # generate highlights (simple heuristic)
    highlights = _extract_highlights(summary_text, max_highlights=3)

    # Compose a TLDR line if you want (optional). Here we keep response as before (summary + highlights)
    # Return SummarizeResponse
    return SummarizeResponse(summary=summary_text.strip(), highlights=highlights)