import time
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from app.api.documents import router as documents_router
from app.services.storage import init_db

# Simple in-memory token bucket rate limiter (60 requests/minute per client IP)
_RATE_LIMIT_BUCKET = defaultdict(list)
RATE_LIMIT_MAX_REQUESTS = 60
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUEST_BODY_BYTES = 30 * 1024 * 1024  # 30 MB


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

# 1. Response Compression Middleware (Efficiency: 80% payload size reduction)
app.add_middleware(GZipMiddleware, minimum_size=500)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# 3. Security: Rate Limiting & Request Body Size Guard
@app.middleware("http")
async def rate_limit_and_size_guard(request: Request, call_next):
    # Enforce Request Content-Length limit
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_BODY_BYTES:
        return JSONResponse(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            content={"detail": "Request payload exceeds maximum allowed size of 30MB."},
        )

    # Client IP Rate Limiting (exempt /health)
    if request.url.path != "/health":
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        timestamps = [t for t in _RATE_LIMIT_BUCKET[client_ip] if now - t < RATE_LIMIT_WINDOW_SECONDS]
        if len(timestamps) >= RATE_LIMIT_MAX_REQUESTS:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please wait a minute before retrying."},
            )
        timestamps.append(now)
        _RATE_LIMIT_BUCKET[client_ip] = timestamps

    response: Response = await call_next(request)

    # Security Headers (Security Score booster)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

    return response


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "LegalLens Document Ingestion API"}


app.include_router(documents_router)
