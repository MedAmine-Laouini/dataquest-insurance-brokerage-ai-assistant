from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import auth, clients, dashboard, data, classification, policies
from app.ml_pipeline import classification_service

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Load ML model
    try:
        classification_service.load()
        logger.info("ML classification model loaded successfully.")
    except Exception as exc:
        logger.error("Failed to load ML model: %s", exc)

    yield


app = FastAPI(
    title="Broker AI API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://dataquest-insurance-brokerage-ai-as.vercel.app","https://dataquest-insurance-brokerage-ai-as-gold.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(dashboard.router)
app.include_router(data.router)
app.include_router(classification.router)
app.include_router(policies.router)


@app.get("/")
async def root():
    return {"message": "Broker AI API is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
