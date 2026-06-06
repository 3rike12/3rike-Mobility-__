from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Station, Prediction
from app.schemas import StationOut, PredictionOut

router = APIRouter(prefix="/stations", tags=["stations"])


@router.get("", response_model=list[StationOut])
def list_stations(db: Session = Depends(get_db)):
    return db.query(Station).all()


@router.get("/{station_id}", response_model=StationOut)
def get_station(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.station_id == station_id).first()
    if not station:
        raise HTTPException(404, "Station not found")
    return station


@router.get("/{station_id}/forecast", response_model=list[PredictionOut])
def get_forecast(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.station_id == station_id).first()
    if not station:
        raise HTTPException(404, "Station not found")

    predictions = (
        db.query(Prediction)
        .filter(Prediction.station_id == station_id)
        .order_by(Prediction.hour)
        .all()
    )
    if not predictions:
        raise HTTPException(404, "No predictions available yet")
    return predictions
