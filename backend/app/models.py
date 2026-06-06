from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Station(Base):
    __tablename__ = "stations"

    station_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    current_batteries = Column(Integer, default=0)
    max_capacity = Column(Integer, default=50)


class SwapEvent(Base):
    __tablename__ = "swap_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, ForeignKey("stations.station_id"), nullable=False)
    recorded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    swaps_count = Column(Integer, nullable=False)

    station = relationship("Station")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, ForeignKey("stations.station_id"), nullable=False)
    hour = Column(DateTime, nullable=False)
    predicted_demand = Column(Integer, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

    station = relationship("Station")

    __table_args__ = (
        UniqueConstraint("station_id", "hour", name="uq_station_hour"),
    )
