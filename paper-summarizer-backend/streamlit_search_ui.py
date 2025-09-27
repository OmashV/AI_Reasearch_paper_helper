import streamlit as st
import requests
from typing import Optional

# Config / change these if your services run on different ports
SEARCH_URL = "http://127.0.0.1:8001/search"
SUMMARIZE_URL = "http://127.0.0.1:8002/summarize"
CITATION_URL = "http://127.0.0.1:8003/cite"

st.set_page_config(page_title="Paper Search + Summarize + Cite", layout="wide")

st.title("Paper Search, Summarizer & Citation")

# Initialize session state for storing summaries, citations, and expander states
if "summaries" not in st.session_state:
    st.session_state.summaries = {}  # {paper_index: {"summary": str, "highlights": list}}
if "citations" not in st.session_state:
    st.session_state.citations = {}  # {paper_index: {"apa": str, "bibtex": str}}
if "expander_states" not in st.session_state:
    st.session_state.expander_states = {}  # {paper_index: bool}

with st.sidebar:
    st.header("Settings")
    api_token = st.text_input("Bearer token (optional)", value="", type="password")
    search_url = st.text_input("Search URL", value=SEARCH_URL)
    summarize_url = st.text_input("Summarize URL", value=SUMMARIZE_URL)
    citation_url = st.text_input("Citation URL", value=CITATION_URL)
    st.markdown("Adjust URLs if your services run on different ports.")

headers = {}
if api_token:
    headers["Authorization"] = f"Bearer {api_token}"
headers["Content-Type"] = "application/json"

query = st.text_input("Query", value="transformer language models")
limit = st.number_input("Limit", min_value=1, max_value=20, value=5, step=1)
search_btn = st.button("Search")

def call_search(q: str, limit: int, headers: dict, url: str):
    payload = {"query": q, "limit": limit}
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Search request failed: {e}")
        return None

def call_summarize(text: str, headers: dict, url: str, max_tokens: Optional[int]=200):
    payload = {"text": text, "max_tokens": max_tokens}
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=120)
        r.raise_for_status()
        response = r.json()
        st.write(f"Debug: Summarize API response: {response}")
        return response
    except requests.exceptions.RequestException as e:
        st.error(f"Summarize request failed: {e}")
        st.write(f"Debug: Request payload: {payload}")
        return None

def call_cite(paper: dict, headers: dict, url: str):
    payload = {"papers": [{
        "id": paper.get("arxiv_id", ""),
        "title": paper.get("title", ""),
        "authors": paper.get("authors", []),
        "year": paper.get("year", ""),
        "arxiv_id": paper.get("arxiv_id", ""),
        "url": paper.get("url", "")
    }]}
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=30)
        r.raise_for_status()
        response = r.json()
        st.write(f"Debug: Citation API response: {response}")
        return response
    except requests.exceptions.RequestException as e:
        st.error(f"Citation request failed: {e}")
        st.write(f"Debug: Request payload: {payload}")
        return None

if search_btn:
    if not query.strip():
        st.warning("Enter a query.")
    else:
        with st.spinner("Searching..."):
            data = call_search(query, limit, headers, search_url)
        if not data:
            st.stop()
        papers = data.get("papers", [])
        if len(papers) == 0:
            st.info("No papers found.")
        else:
            st.success(f"Found {len(papers)} papers.")
            # Clear previous summaries and citations on new search
            st.session_state.summaries = {}
            st.session_state.citations = {}
            st.session_state.expander_states = {}

# Display papers if they exist
if "papers" in locals() and papers:
    for i, p in enumerate(papers):
        expander_state = st.session_state.expander_states.get(i, False)
        with st.expander(f"{i+1}. {p.get('title')}", expanded=expander_state):
            cols = st.columns([5, 1])
            with cols[0]:
                st.markdown(f"**{p.get('title')}**")
                authors = ", ".join(p.get("authors") or [])
                meta = f"{authors} • {p.get('year') or ''} • {p.get('arxiv_id') or ''}"
                st.caption(meta)
                abstract = p.get("abstract") or ""
                st.write(abstract if len(abstract) < 800 else abstract[:800] + "…")
                st.markdown(f"[Open link]({p.get('url')})")
            with cols[1]:
                st.write(f"Debug: Button state for paper {i}")
                if st.button("Summarize", key=f"summarize-{i}"):
                    st.session_state.expander_states[i] = True
                    with st.spinner("Summarizing..."):
                        text = abstract or p.get("title", "") or "No content available."
                        st.write(f"Debug: Input text to summarize: {text}")
                        resp = call_summarize(text, headers, summarize_url, max_tokens=300)
                        if resp:
                            st.session_state.summaries[i] = {
                                "summary": resp.get("summary") or resp.get("summary_text") or "",
                                "highlights": resp.get("highlights") or []
                            }
                        else:
                            st.session_state.summaries[i] = {"summary": "Failed to summarize.", "highlights": []}
                if st.button("Cite", key=f"cite-{i}"):
                    st.session_state.expander_states[i] = True
                    with st.spinner("Generating citation..."):
                        resp = call_cite(p, headers, citation_url)
                        if resp and resp.get("citations"):
                            st.session_state.citations[i] = {
                                "apa": resp["citations"][0].get("apa", ""),
                                "bibtex": resp["citations"][0].get("bibtex", "")
                            }
                        else:
                            st.session_state.citations[i] = {"apa": "Failed to cite.", "bibtex": ""}
            # Display summary and citation if they exist
            if i in st.session_state.summaries:
                st.markdown("**Summary**")
                st.write(st.session_state.summaries[i]["summary"] or "No summary available.")
                if st.session_state.summaries[i]["highlights"]:
                    st.markdown("**Highlights**")
                    for h in st.session_state.summaries[i]["highlights"]:
                        st.write(f"- {h}")
                else:
                    st.info("No highlights returned.")
            if i in st.session_state.citations:
                st.markdown("**Citation**")
                st.write(f"**APA**: {st.session_state.citations[i]['apa']}")
                st.write(f"**BibTeX**:")
                st.code(st.session_state.citations[i]["bibtex"], language="bibtex")

st.markdown("---")
st.markdown("Quick tips: use the service URLs on the left, leave token empty for no auth. Streamlit runs server-side, so CORS isn't an issue.")