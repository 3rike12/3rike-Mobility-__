from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import stations, predictions

app = FastAPI(
    title="3rike Mobility - Battery Swap API",
    version="0.1.0",
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


@app.get("/health")
def health():
    return {"status": "ok"}
