<div align="center">

<img src="https://img.shields.io/badge/LegalLens-GenAI%20Legal%20Intelligence-6366f1?style=for-the-badge&logo=scales&logoColor=white" alt="LegalLens" height="45"/>

<h1>⚖️ LegalLens</h1>

<p><strong>AI-powered legal document intelligence — understand before you sign.</strong></p>

<p>
  <a href="https://legal-lens-prompt-war.vercel.app/"><img src="https://img.shields.io/badge/🌐%20Live%20Demo-legal--lens--prompt--war.vercel.app-6366f1?style=for-the-badge"/></a>
</p>

<p>
  <a href="#-features"><img src="https://img.shields.io/badge/Features-7-6366f1?style=flat-square"/></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js"/></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi&logoColor=white"/></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white"/></a>
  <a href="https://legal-lens-prompt-war.vercel.app/"><img src="https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel&logoColor=white"/></a>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square"/>
</p>

<p>
  <a href="#-live-demo">Live Demo</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#%EF%B8%8F-architecture">Architecture</a> •
  <a href="#-api-reference">API Reference</a>
</p>

---

> **LegalLens** transforms complicated rental contracts, employment agreements, policies, and service terms into clear **plain-language insights**, grounded Q&A, and actionable lawyer preparation briefs — powered by **Google Gemini 2.5 Flash**.

</div>

---

## 🌐 Live Demo

**The app is publicly deployed and ready to use — no setup required.**

> ### 👉 [https://legal-lens-prompt-war.vercel.app/](https://legal-lens-prompt-war.vercel.app/)

Just visit the link, upload any legal document (PDF, DOCX, or TXT), and get instant AI-powered insights.

---

## 🎯 The Problem

Millions of people sign legal documents every day — leases, employment contracts, NDAs, service agreements — without truly understanding what they're agreeing to. Legal jargon is notoriously opaque, and attorneys are expensive. **LegalLens bridges this gap**.

---

## ✨ Features

| Feature | Description |
|---|---|
| **📄 Document Ingestion** | Upload PDF, DOCX, or TXT files. Magic-byte file validation + secure storage. |
| **🧠 Plain-Language Breakdown** | Gemini 2.5 Flash extracts parties, obligations, payments, dates, and key terms in everyday language. |
| **🔍 Clause Detection** | Auto-categorizes clauses: Termination, Liability, Penalties, Confidentiality, Non-Compete, Disputes. |
| **⚠️ Attention & Risk Signals** | Highlights unusual or restrictive terms with objective, cautious language. |
| **💬 Grounded "Ask Your Doc" Q&A** | RAG-powered Q&A — every answer cites exact page numbers from the document. |
| **🔄 Contract Version Comparison** | Side-by-side diff of two document versions with AI-generated plain-language impact summaries. |
| **📋 Lawyer Prep Brief** | Generates a structured meeting brief: questions to ask, clauses to review, documents to bring. |

---

## 🛠 Tech Stack

### Frontend
- **[Next.js 14](https://nextjs.org/)** — React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** — Type safety across the UI
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first styling
- **[Framer Motion](https://www.framer.com/motion/)** — Smooth page & component animations
- **[Lucide React](https://lucide.dev/)** — Icon library

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** — High-performance async Python API
- **[Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/)** — Structured legal analysis with JSON output mode
- **[PyMuPDF](https://pymupdf.readthedocs.io/)** — Robust PDF parsing
- **[python-docx](https://python-docx.readthedocs.io/)** — DOCX text extraction
- **[Pydantic v2](https://docs.pydantic.dev/)** — Data validation & structured AI output schemas
- **[Tenacity](https://tenacity.readthedocs.io/)** — Retry logic for external API calls

### Infrastructure
- **[Vercel](https://vercel.com/)** — Frontend deployed and publicly accessible
- **[Docker](https://www.docker.com/)** — Containerized backend for self-hosting
- **Live URL:** [https://legal-lens-prompt-war.vercel.app/](https://legal-lens-prompt-war.vercel.app/)

---

## 🏗️ Architecture

```
LegalLens/
├── src/                        # Next.js 14 Frontend (App Router)
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   ├── upload/             # Document upload flow
│   │   ├── workspace/          # Analysis workspace (tabs)
│   │   ├── compare/            # Document comparison view
│   │   └── dashboard/          # Documents dashboard
│   └── components/
│       ├── layout/             # Shared layout components
│       └── workspace/
│           ├── OverviewTab.tsx       # Plain-language summary
│           ├── ClausesTab.tsx        # Clause extraction
│           ├── AttentionTab.tsx      # Risk signals
│           ├── ChatTab.tsx           # Grounded Q&A
│           ├── ChecklistTab.tsx      # Action checklist
│           └── LawyerPrepTab.tsx     # Lawyer brief generator
│
├── backend/                    # FastAPI Python Backend
│   └── app/
│       ├── main.py             # App entrypoint + CORS + security headers
│       ├── api/
│       │   └── documents.py    # REST endpoints (upload, analyze, chat, compare)
│       ├── services/
│       │   ├── gemini_service.py     # Gemini 2.5 Flash integration
│       │   ├── rag_service.py        # Retrieval-Augmented Generation (Q&A)
│       │   ├── comparison_service.py # Document version comparison
│       │   ├── embedding_service.py  # Embedding generation
│       │   ├── vector_store.py       # In-memory vector store
│       │   ├── chunker.py            # Document chunking for RAG
│       │   ├── validation.py         # Magic-byte file validation
│       │   ├── storage.py            # Document & analysis persistence
│       │   └── parsers/              # PDF, DOCX, TXT parsers
│       ├── schemas/            # Pydantic v2 models
│       ├── models/             # Data models
│       └── core/
│           └── prompts.py      # Gemini prompt engineering
│
├── Dockerfile                  # Frontend Docker image
└── backend/Dockerfile          # Backend Docker image
```

### Data Flow

```
User → Upload Document
      ↓
  File Validation (magic bytes, size, type)
      ↓
  Text Extraction (PyMuPDF / python-docx)
      ↓
  Gemini 2.5 Flash → Structured JSON Analysis
      ↓
  Stored in SQLite → Served via FastAPI REST API
      ↓
  Next.js Workspace (Overview / Clauses / Attention / Checklist / Lawyer Brief)
      ↓
  RAG Q&A: Embedding chunks → Semantic search → Grounded Gemini answer with citations
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- A **[Google Gemini API key](https://aistudio.google.com/app/apikey)**

---

### 1. Clone the Repository

```bash
git clone https://github.com/Zaidkhann/LegalLens-PromptWar.git
cd LegalLens-PromptWar
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env              # or create .env manually
```

Edit `backend/.env`:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Start the backend server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

The API will be available at `http://localhost:8001`. Interactive docs at `http://localhost:8001/docs`.

### 3. Frontend Setup

```bash
# From the project root
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local

# Start the development server
npm run dev
```

The app will be live at **`http://localhost:3000`** 🎉

---

## 🐳 Docker Setup

Run both services with Docker:

```bash
# Build and run the backend
cd backend
docker build -t legallens-backend .
docker run -p 8001:8001 -e GEMINI_API_KEY=your_key legallens-backend

# Build and run the frontend (from root)
cd ..
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8001 -t legallens-frontend .
docker run -p 3000:3000 legallens-frontend
```

---

## 📡 API Reference

All endpoints are prefixed with `/api/v1/documents`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/documents` | List all uploaded documents |
| `POST` | `/api/v1/documents/upload` | Upload a legal document (PDF/DOCX/TXT) |
| `GET` | `/api/v1/documents/{id}` | Get document metadata |
| `GET` | `/api/v1/documents/{id}/content` | Get full extracted text content |
| `POST` | `/api/v1/documents/{id}/analyze` | Trigger Gemini AI legal analysis |
| `GET` | `/api/v1/documents/{id}/analysis` | Get structured analysis result |
| `POST` | `/api/v1/documents/{id}/chat` | Grounded Q&A (RAG) with page citations |
| `POST` | `/api/v1/documents/compare` | Compare two document versions |
| `GET` | `/api/v1/documents/compare/{id}` | Get stored comparison result |
| `GET` | `/health` | Health check |

> Full interactive API documentation available at `http://localhost:8001/docs` when the backend is running.

---

## 🔒 Security & Responsible AI

LegalLens is built with security and responsible AI at its core:

- **Magic-byte file validation** — Validates actual file content, not just extensions
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`
- **Prompt injection defense** — Structured JSON output mode prevents prompt injection
- **AI disclaimer** — LegalLens provides **informational assistance only** and does **not** constitute formal legal advice or replace a licensed attorney
- **Grounded answers** — Every AI response is grounded in the document text with exact page citations, preventing hallucination
- **Cautious language** — Risk signals use objective, non-alarmist framing

---

## ☁️ Deployment

### ✅ Live on Vercel

The application is **already deployed** and publicly accessible at:

> **[https://legal-lens-prompt-war.vercel.app/](https://legal-lens-prompt-war.vercel.app/)**

No credentials or sign-up required — open the link and start analyzing your documents instantly.

### Self-Hosting the Frontend on Vercel

To deploy your own fork:

1. Fork this repository
2. Import it on [vercel.com](https://vercel.com)
3. Set the environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url
```

4. Click **Deploy** — Vercel handles the rest.

### Self-Hosting the Backend (Docker)

```bash
cd backend
docker build -t legallens-backend .
docker run -p 8001:8001 -e GEMINI_API_KEY=your_key legallens-backend
```

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v
```

---

## 🗺️ Roadmap

- [ ] Multi-document workspace (manage a portfolio of contracts)
- [ ] PDF annotation overlay (highlight clauses directly in the viewer)
- [ ] Export lawyer brief as structured PDF
- [ ] User authentication & document history
- [ ] Support for additional languages
- [ ] Webhook notifications for background analysis completion

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the Google PromptWar Hackathon**

<sub>Powered by Google Gemini 2.5 Flash · Next.js 14 · FastAPI</sub>

</div>
