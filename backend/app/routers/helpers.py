from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Station, SwapEvent, TransportTrip


NGN_STATIONS = {"vi", "lekki1", "ajah", "ikeja", "maryland", "yaba",
    "surulere", "allen", "ikoyi", "apapa", "festac", "ogba",
    "ojota", "oshodi", "isolo", "agege", "gbagada", "ogudu",
    "jakande", "ilupeju"}
OFFLINE_STATIONS = {"festac", "ojota"}


def station_status(capacity: int, current_batteries: int) -> str:
    if current_batteries is None:
        return "offline"
    ratio = current_batteries / capacity if capacity > 0 else 0
    if ratio >= 0.6:
        return "online"
    elif ratio >= 0.25:
        return "warning"
    return "critical"


def is_offline(sid: str) -> bool:
    return sid in OFFLINE_STATIONS


def station_address(sid: str, name: str) -> str:
    base = name.replace(" Station", "").replace(" Hub", "").replace(" Mall", "")
    if sid in NGN_STATIONS:
        return f"{base}, Lagos"
    return f"{base}, Abuja"


def est_empty_minutes(current_batteries: int, swap_rate_hourly: float) -> int:
    if swap_rate_hourly <= 0 or current_batteries <= 0:
        return 0
    return int(current_batteries / swap_rate_hourly * 60)


def swaps_today(db: Session, station_id: str) -> int:
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    total = (
        db.query(func.sum(SwapEvent.swaps_count))
        .filter(SwapEvent.station_id == station_id, SwapEvent.recorded_at >= today)
        .scalar()
    )
    return total or 0


def swap_rate(db: Session, station_id: str) -> float:
    day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    avg = (
        db.query(func.avg(SwapEvent.swaps_count))
        .filter(SwapEvent.station_id == station_id, SwapEvent.recorded_at >= day_ago)
        .scalar()
    )
    return avg or 0


def normalize_coords(stations: list[Station]) -> dict[str, tuple[float, float]]:
    if not stations:
        return {}
    lats = [s.lat for s in stations]
    lngs = [s.lng for s in stations]
    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)
    lat_rng = max_lat - min_lat or 1
    lng_rng = max_lng - min_lng or 1
    return {
        s.station_id: (
            round((s.lng - min_lng) / lng_rng * 100, 1),
            round((s.lat - min_lat) / lat_rng * 100, 1),
        )
        for s in stations
    }


def station_to_item(station: Station, db: Session) -> dict:
    off = is_offline(station.station_id)
    inv = station.current_batteries if not off else None
    st = "offline" if off else station_status(station.max_capacity, station.current_batteries)
    sts = swaps_today(db, station.station_id)
    rate = swap_rate(db, station.station_id)
    est = est_empty_minutes(station.current_batteries, rate) if not off else None
    return {
        "id": station.station_id,
        "name": station.name,
        "status": st,
        "inventory": inv,
        "capacity": station.max_capacity,
        "swaps_today": sts if not off else None,
        "est_empty_minutes": est,
        "last_online_at": datetime.now(timezone.utc) - timedelta(hours=2) if off else None,
    }


def station_label(name: str) -> str:
    return name.replace(" Station", "").replace(" Hub", "").replace(" Mall", "").replace(" Tech Campus", " Tech")
