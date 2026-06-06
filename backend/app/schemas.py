from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StationOut(BaseModel):
    station_id: str
    name: str
    lat: float
    lng: float
    current_batteries: int
    max_capacity: int

    class Config:
        from_attributes = True


class PredictionOut(BaseModel):
    station_id: str
    hour: datetime
    predicted_demand: int

    class Config:
        from_attributes = True


class RebalanceRecommendation(BaseModel):
    from_station: str
    to_station: str
    batteries_to_move: int
    reason: str
