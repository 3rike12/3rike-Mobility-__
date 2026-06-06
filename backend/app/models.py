from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

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
    recorded_at = Column(DateTime, nullable=False)
    swaps_count = Column(Integer, nullable=False)

    station = relationship("Station")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String, ForeignKey("stations.station_id"), nullable=False)
    hour = Column(DateTime, nullable=False)
    predicted_demand = Column(Integer, nullable=False)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    station = relationship("Station")

    __table_args__ = (
        UniqueConstraint("station_id", "hour", name="uq_station_hour"),
    )


class FleetTrip(Base):
    __tablename__ = "fleet_trips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String, nullable=False)
    driver = Column(String, nullable=False)
    route_from = Column(String, nullable=False)
    route_to = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    fuel_used_l = Column(Float, nullable=False)
    fuel_expected_l = Column(Float, nullable=False)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=False)
    deviation_km = Column(Float, default=0)
    unauthorized_stop = Column(Integer, default=0)
    status = Column(String, default="completed")


class TransportTrip(Base):
    __tablename__ = "transport_trips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_type = Column(String, nullable=False)  # danfo, keke, okada
    vehicle_id = Column(String, nullable=False)
    route_name = Column(String, nullable=False)
    passenger_count = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=False)
    fare_collected = Column(Float, nullable=False)  # NGN


class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(String, nullable=False)
    from_station_id = Column(String, ForeignKey("stations.station_id"), nullable=False)
    to_station_id = Column(String, ForeignKey("stations.station_id"), nullable=False)
    status = Column(String, default="pending")  # pending, in_transit, completed, cancelled
    batteries = Column(Integer, nullable=False)
    scheduled_at = Column(DateTime, nullable=True)
    departed_at = Column(DateTime, nullable=True)
    eta_at = Column(DateTime, nullable=True)
    progress_pct = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class OrganizationSettings(Base):
    __tablename__ = "organization_settings"

    id = Column(Integer, primary_key=True, default=1)
    org_name = Column(String, default="3rike Lagos")
    org_region = Column(String, default="Lagos")
    org_currency = Column(String, default="NGN")
    org_timezone = Column(String, default="Africa/Lagos")
    critical_below_pct = Column(Integer, default=15)
    warning_below_pct = Column(Integer, default=30)
    auto_generate_alerts = Column(Integer, default=1)
    predictive_warnings = Column(Integer, default=1)
    forecast_horizon = Column(String, default="24h")
    auto_redistribute_surplus = Column(Integer, default=1)
    weather_adjusted = Column(Integer, default=1)
    critical_alerts = Column(Integer, default=1)
    daily_digest = Column(Integer, default=1)
    sms_field_team = Column(Integer, default=0)
    weekly_report = Column(Integer, default=0)
