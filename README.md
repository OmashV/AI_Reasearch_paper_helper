# Paper Summarizer

Welcome to the **Paper Summarizer** project! This application allows users to search for academic papers, view summaries, citations, and engage in conversational queries about research topics. The frontend is built with **React**, while the backend is a **FastAPI-based microservices architecture** integrating external APIs like **Cosmos RP** and **Semantic Scholar**.

---

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [Configuration](#configuration)
- [Development](#development)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [Contributors](#contributors)
- [License](#license)
- [Contact](#contact)

---

## Features
- User authentication (login/register) with **JWT tokens**
- Semantic search for academic papers using **Semantic Scholar API**
- Abstractive summarization of paper abstracts using **BART**
- Automatic **APA & BibTeX** citation generation
- Natural, conversational responses powered by **Cosmos RP**
- Speech-to-text input using **Web Speech API**
- Chat history with session persistence
- Premium upgrade modal with feature comparison
- Responsive, modern UI with **Tailwind CSS**

---

## Architecture
The system is divided into two main parts:

### Frontend (`paper-summarizer-frontend`)
- **Tech Stack**: React, React Router, Tailwind CSS, Axios
- **Structure**:
  - `src/components/`: Reusable UI components (e.g., `Chat.js`, `PaperCard.js`, `PremiumModal.js`)
  - `src/context/`: Global state (e.g., `AuthContext.js`)
  - `src/services/`: API calls (`api.js`)
- **Functionality**: Handles UI, authentication, chat flow, and speech input

### Backend (`paper-summarizer-backend`)
- **Tech Stack**: FastAPI, Python, `httpx`, `asyncio`
- **Microservices**:
  - **Orchestrator (Port 8000)**: Auth + agent coordination
  - **Search Agent (Port 8001)**: Semantic Scholar integration
  - **Summarizer Agent (Port 8002)**: BART summarization
  - **Citation Agent (Port 8003)**: APA/BibTeX formatting
- **External Integration**: Cosmos RP for conversational AI
- **Process**: Parallel agent execution → consolidated JSON response

### System Architecture Diagram
![System Architecture](architecture.png)

---

## Prerequisites
- **Node.js** (v14 or later)
- **Python** (v3.9 or later)
- **npm** or **yarn**
- **pip**
- **Git**
- **Docker** (optional)

---

## Installation

### Frontend
```bash
cd paper-summarizer-frontend
npm install
