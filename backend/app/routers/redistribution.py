from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Station, Transfer, Prediction
from app.schemas import (
    RedistributionStats, InTransit, CompletedToday, Fleet,
    RouteMap, MapNode, RouteLine, VehiclePosition,
    TransferList, TransferItem, TransferCreate,
    OptimizeRequest, OptimizeResponse, ProposedTransfer,
)

router = APIRouter(tags=["redistribution"])

NGN_STATIONS = {"vi", "lekki1", "ajah", "ikeja", "maryland", "yaba",
    "surulere", "allen", "ikoyi", "apapa", "festac", "ogba",
    "ojota", "oshodi", "isolo", "agege", "gbagada", "ogudu",
    "jakande", "ilupeju"}


def _normalize_coords(stations: list[Station]) -> dict[str, tuple[float, float]]:
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


def _station_label(name: str) -> str:
    return name.replace(" Station", "").replace(" Hub", "").replace(" Mall", "").replace(" Tech Campus", " Tech")


@router.get("/redistribution/stats", response_model=RedistributionStats)
def get_redistribution_stats(db: Session = Depends(get_db)):
    pending = db.query(Transfer).filter(Transfer.status == "pending").count()
    in_transit = db.query(Transfer).filter(Transfer.status == "in_transit").all()
    completed = db.query(Transfer).filter(
        Transfer.status == "completed",
        Transfer.created_at >= datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0),
    ).all()
    batts_en_route = sum(t.batteries for t in in_transit)
    batts_completed = sum(t.batteries for t in completed)
    active_vehicles = db.query(Transfer.vehicle_id).filter(
        Transfer.status.in_(["pending", "in_transit"])
    ).distinct().count()

    return RedistributionStats(
        pending_transfers=pending,
        in_transit=InTransit(count=len(in_transit), batteries_en_route=batts_en_route),
        completed_today=CompletedToday(count=len(completed), batteries_moved=batts_completed),
        fleet=Fleet(active=active_vehicles, total=max(8, active_vehicles + 2)),
    )


@router.get("/redistribution/routes", response_model=RouteMap)
def get_redistribution_routes(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    coords = _normalize_coords(stations)
    station_map = {s.station_id: s for s in stations}
    now = datetime.now(timezone.utc)

    active_transfers = (
        db.query(Transfer)
        .filter(Transfer.status.in_(["pending", "in_transit"]))
        .all()
    )

    node_ids = set()
    for t in active_transfers:
        node_ids.add(t.from_station_id)
        node_ids.add(t.to_station_id)

    nodes = []
    for sid in node_ids:
        s = station_map.get(sid)
        if not s:
            continue
        x, y = coords.get(sid, (50, 50))
        nodes.append(MapNode(
            id=sid,
            label=_station_label(s.name),
            kind="source",
            x=x, y=y,
            lat=s.lat, lng=s.lng,
        ))

    routes = []
    vehicles = []
    for t in active_transfers:
        from_coords = coords.get(t.from_station_id, (50, 50))
        to_coords = coords.get(t.to_station_id, (50, 50))
        routes.append(RouteLine(
            id=f"rt_{t.id:03d}",
            from_id=t.from_station_id,
            to_id=t.to_station_id,
            vehicle_id=t.vehicle_id,
        ))
        progress = t.progress_pct / 100.0 if t.progress_pct else 0
        vx = round(from_coords[0] + (to_coords[0] - from_coords[0]) * progress, 1)
        vy = round(from_coords[1] + (to_coords[1] - from_coords[1]) * progress, 1)
        vehicles.append(VehiclePosition(
            id=t.vehicle_id,
            label=t.vehicle_id,
            x=vx, y=vy,
            units=t.batteries,
            transfer_id=f"trf_{t.id:03d}",
        ))

    return RouteMap(
        generated_at=now,
        nodes=nodes,
        routes=routes,
        vehicles=vehicles,
    )


@router.get("/transfers", response_model=TransferList)
def get_transfers(
    status: str = Query(None),
    limit: int = Query(50),
    cursor: str = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Transfer)
    if status:
        q = q.filter(Transfer.status == status)
    else:
        q = q.filter(Transfer.status.in_(["pending", "in_transit"]))
    q = q.order_by(Transfer.created_at.desc()).limit(limit + 1)
    transfers = q.all()

    has_more = len(transfers) > limit
    items = transfers[:limit]
    station_ids = set()
    for t in items:
        station_ids.add(t.from_station_id)
        station_ids.add(t.to_station_id)
    station_map = {s.station_id: s for s in db.query(Station).filter(Station.station_id.in_(station_ids)).all()}

    return TransferList(
        items=[
            TransferItem(
                id=f"trf_{t.id:03d}",
                vehicle_id=t.vehicle_id,
                from_station_id=t.from_station_id,
                to_station_id=t.to_station_id,
                route_label=f"{_station_label(station_map.get(t.from_station_id, Station(station_id=t.from_station_id, name=t.from_station_id)).name)} → {_station_label(station_map.get(t.to_station_id, Station(station_id=t.to_station_id, name=t.to_station_id)).name)}",
                status=t.status,
                batteries=t.batteries,
                eta_at=t.eta_at,
                departs_at=t.scheduled_at or t.departed_at,
                progress_pct=t.progress_pct or 0,
            )
            for t in items
        ],
        next_cursor=str(items[-1].id) if has_more else None,
    )


@router.post("/transfers", status_code=201, response_model=TransferItem)
def create_transfer(body: TransferCreate, db: Session = Depends(get_db)):
    from_station = db.query(Station).filter(Station.station_id == body.from_station_id).first()
    if not from_station:
        raise HTTPException(404, "Source station not found")
    to_station = db.query(Station).filter(Station.station_id == body.to_station_id).first()
    if not to_station:
        raise HTTPException(404, "Destination station not found")
    if body.batteries > from_station.current_batteries:
        raise HTTPException(422, f"Not enough batteries at {body.from_station_id}")

    vehicle_id = body.vehicle_id or f"VH-{body.from_station_id[:2]}"

    transfer = Transfer(
        vehicle_id=vehicle_id,
        from_station_id=body.from_station_id,
        to_station_id=body.to_station_id,
        status="pending",
        batteries=body.batteries,
        scheduled_at=body.scheduled_at,
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    return TransferItem(
        id=f"trf_{transfer.id:03d}",
        vehicle_id=transfer.vehicle_id,
        from_station_id=transfer.from_station_id,
        to_station_id=transfer.to_station_id,
        route_label=f"{_station_label(from_station.name)} → {_station_label(to_station.name)}",
        status=transfer.status,
        batteries=transfer.batteries,
        eta_at=transfer.eta_at,
        departs_at=transfer.scheduled_at,
        progress_pct=transfer.progress_pct or 0,
    )


@router.post("/redistribution/optimize", response_model=OptimizeResponse)
def optimize_redistribution(body: OptimizeRequest, db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    proposals = []

    for s in stations:
        preds = (
            db.query(Prediction)
            .filter(Prediction.station_id == s.station_id)
            .all()
        )
        total_pred = sum(p.predicted_demand for p in preds) if preds else 0
        shortfall = max(0, total_pred - s.current_batteries)

        if shortfall > 10:
            donors = [
                d for d in stations
                if d.station_id != s.station_id and d.current_batteries > 20
            ]
            if donors:
                donor = donors[0]
                move = min(shortfall, donor.current_batteries - 10)
                proposals.append(ProposedTransfer(
                    from_station_id=donor.station_id,
                    to_station_id=s.station_id,
                    batteries=move,
                    reason=f"{s.name} forecast empty in {s.current_batteries // max(1, total_pred // 24)}h",
                    est_improvement_pct=12,
                ))

    applied = False
    if body.auto_apply and proposals:
        for p in proposals:
            transfer = Transfer(
                vehicle_id=f"VH-{p.from_station_id[:2]}",
                from_station_id=p.from_station_id,
                to_station_id=p.to_station_id,
                status="pending",
                batteries=p.batteries,
            )
            db.add(transfer)
        db.commit()
        applied = True
        for idx, p in enumerate(proposals):
            p.transfer_id = f"trf_{db.query(Transfer).count():03d}"

    return OptimizeResponse(proposed=proposals[:5], applied=applied)
