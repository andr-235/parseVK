from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(title="parseVK API Gateway")

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "UP"}

    return app


app = create_app()
