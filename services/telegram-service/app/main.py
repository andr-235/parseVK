import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.telegram_service.router import router
from app.modules.telegram_tgmbase.router import router as telegram_tgmbase_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("telegram-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting telegram-service")
    yield
    logger.info("Shutting down telegram-service")


app = FastAPI(title="parseVK Telegram Service", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(telegram_tgmbase_router)


@app.get("/health")
async def health():
    return {"status": "UP"}


@app.get("/ready")
async def ready() -> dict[str, str]:
    from fastapi import HTTPException
    from sqlalchemy import text

    from app.db.session import engine
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "READY"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database is not ready: {str(e)}") from e
