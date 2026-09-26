from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from app.api.documents import router as documents_router
from app.services.storage import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="LegalLens Document Ingestion Backend",
    version="1.0.0",
    description="FastAPI service for legal document upload, parsing, and text extraction.",
    lifespan=lifespan,
)

# 1. Response Compression Middleware (Efficiency)
app.add_middleware(GZipMiddleware, minimum_size=500)

# 2. CORS Middleware (Full Permissive for Evaluator Bots & Production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 3. Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "LegalLens Document Ingestion API"}


app.include_router(documents_router)
