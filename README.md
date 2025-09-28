# SummIT (Paper Summarizer)

Welcome to **SummIT** — a microservices-based Paper Summarizer that searches academic papers, generates concise summaries and citations, and provides conversational answers powered by Cosmos RP.

This repository contains two main parts:

- `paper-summarizer-frontend` — React + Tailwind frontend  
- `paper-summarizer-backend` — FastAPI microservices (Orchestrator, Search Agent, Summarizer Agent, Citation Agent)

---

## Table of Contents

- [Features](#features)  
- [Architecture](#architecture)  
- [Prerequisites](#prerequisites)  
- [Frontend — Install & Run](#frontend---install--run)  
- [Backend — Install & Run](#backend---install--run)  
- [Environment / Configuration](#environment--configuration)  
- [Testing & Healthchecks](#testing--healthchecks)  
- [Troubleshooting](#troubleshooting)  
- [Development Tips](#development-tips)  
- [License](#license)

---

## Features

- User authentication (register/login) with JWT tokens  
- Paper search via Semantic Scholar / arXiv  
- Abstract summarization using Summarizer Agent  
- Citation formatting (APA / BibTeX)  
- Conversational responses with Cosmos RP  
- Modern responsive UI with Tailwind CSS  

---

## Architecture

- **Frontend**: React, React Router, Tailwind CSS  
- **Backend**: FastAPI microservices  
  - Orchestrator (port `8000`)  
  - Search Agent (port `8001`)  
  - Summarizer Agent (port `8002`)  
  - Citation Agent (port `8003`)  

---

## Prerequisites

- Node.js (v14+) and npm or yarn  
- Python 3.9+ and pip  
- Git  
- Docker (optional, for containerized deployment)  

---

## Frontend — Install & Run

```bash
cd paper-summarizer-frontend
npm install
npm start
# or yarn && yarn start
