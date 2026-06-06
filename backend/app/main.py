from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import stations, predictions
from app.routers.dashboard import router as dashboard_router
from app.routers.forecast import router as forecast_router
from app.routers.redistribution import router as redistribution_router
from app.routers.settings import router as settings_router

app = FastAPI(
    title="3rike Mobility - Battery Swap API",
    version="0.2.0",
    description="Battery Swapping Demand Prediction Backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stations.router)
app.include_router(predictions.router)
app.include_router(dashboard_router)
app.include_router(forecast_router)
app.include_router(redistribution_router)
app.include_router(settings_router)


@app.get("/health")
def health():
    return {"status": "ok"}
