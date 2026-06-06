from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models import Station, Prediction
from app.routers.helpers import (
    station_status, is_offline, station_to_item, station_address,
)
from app.schemas import (
    StationListItem, StationDetail, StationListResponse,
    NetworkSummary, StationCreate, PredictionOut,
)

router = APIRouter(prefix="/stations", tags=["stations"])


@router.get("", response_model=StationListResponse)
def list_stations(
    status: str = Query(None),
    q: str = Query(None),
    limit: int = Query(50),
    cursor: str = Query(None),
    db: Session = Depends(get_db),
):
    all_stations = db.query(Station).all()
    online_count = 0
    warning_count = 0
    critical_count = 0
    total_inv = 0
    total_cap = 0
    for s in all_stations:
        cap = s.max_capacity
        total_cap += cap
        if is_offline(s.station_id):
            pass
        else:
            total_inv += s.current_batteries
            st = station_status(cap, s.current_batteries)
            if st == "online":
                online_count += 1
            elif st == "warning":
                warning_count += 1
            else:
                critical_count += 1

    summary = NetworkSummary(
        total_stations=len(all_stations),
        online=online_count,
        total_inventory=total_inv,
        total_capacity=total_cap,
        critical=critical_count,
        warning=warning_count,
    )

    filtered = []
    for s in all_stations:
        off = is_offline(s.station_id)
        st = "offline" if off else station_status(s.max_capacity, s.current_batteries)
        if status and status != "all" and st != status:
            continue
        if q and q.lower() not in s.name.lower():
            continue
        filtered.append(s)

    items = [StationListItem(**station_to_item(s, db)) for s in filtered[:limit]]

    return StationListResponse(
        summary=summary,
        items=items,
        next_cursor=None,
        total=len(filtered),
    )


@router.get("/{station_id}", response_model=StationDetail)
def get_station(station_id: str, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.station_id == station_id).first()
    if not station:
        raise HTTPException(404, "Station not found")
    item = station_to_item(station, db)
    item["lat"] = station.lat
    item["lng"] = station.lng
    item["address"] = station_address(station.station_id, station.name)
    item["updated_at"] = datetime.now(timezone.utc)
    return StationDetail(**item)


@router.post("", status_code=201, response_model=StationDetail)
def create_station(body: StationCreate, db: Session = Depends(get_db)):
    sid = body.name.lower().replace(" ", "_").replace("-", "_")[:20]
    station = Station(
        station_id=sid,
        name=body.name,
        lat=body.lat or 6.5,
        lng=body.lng or 3.4,
        current_batteries=0,
        max_capacity=body.capacity,
    )
    db.add(station)
    db.commit()
    db.refresh(station)

    item = station_to_item(station, db)
    item["lat"] = station.lat
    item["lng"] = station.lng
    item["address"] = body.address or station_address(station.station_id, station.name)
    item["updated_at"] = datetime.now(timezone.utc)
    return StationDetail(**item)


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
