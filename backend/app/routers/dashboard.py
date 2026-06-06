from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
import random

from app.database import get_db
from app.models import Station, SwapEvent, FleetTrip, TransportTrip
from app.routers.helpers import (
    station_status, is_offline, normalize_coords,
)
from app.schemas import (
    DashboardOverview, TotalBatteries, ActiveSwapsToday, StationsOnline,
    ShortageAlerts, AvgSwapTimeMin, FleetUtilizationPct,
    PredictionAccuracyPct, RevenueToday,
    HeatmapResponse, HeatNode,
    AlertListResponse, AlertItem,
)

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/overview", response_model=DashboardOverview)
def get_dashboard_overview(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    total_bats = sum(s.current_batteries for s in stations)
    online_count = 0
    warning_count = 0
    critical_count = 0
    offline_count = 0
    for s in stations:
        if is_offline(s.station_id):
            offline_count += 1
        else:
            st = station_status(s.max_capacity, s.current_batteries)
            if st == "online":
                online_count += 1
            elif st == "warning":
                warning_count += 1
            else:
                critical_count += 1

    swaps_val = (
        db.query(func.sum(SwapEvent.swaps_count))
        .filter(SwapEvent.recorded_at >= today_start)
        .scalar() or 0
    )
    swaps_yesterday = (
        db.query(func.sum(SwapEvent.swaps_count))
        .filter(SwapEvent.recorded_at >= yesterday_start, SwapEvent.recorded_at < today_start)
        .scalar() or 0
    )
    swaps_delta_pct = round((swaps_val - swaps_yesterday) / (swaps_yesterday or 1) * 100)

    revenue = (
        db.query(func.sum(TransportTrip.fare_collected))
        .filter(TransportTrip.ended_at >= today_start)
        .scalar() or 0
    )

    avg_swap_time = (
        db.query(func.avg(
            func.extract("epoch", FleetTrip.ended_at - FleetTrip.started_at) / 60
        ))
        .filter(FleetTrip.started_at >= today_start)
        .scalar()
    )
    avg_swap_time_val = round(avg_swap_time, 1) if avg_swap_time else 2.4

    active_fleet = db.query(FleetTrip).filter(
        FleetTrip.status == "in_transit",
        FleetTrip.started_at >= today_start,
    ).count()
    total_fleet_today = db.query(FleetTrip).filter(
        FleetTrip.started_at >= today_start
    ).count()
    fleet_util = round(active_fleet / max(total_fleet_today, 1) * 100)

    return DashboardOverview(
        total_batteries=TotalBatteries(value=total_bats, delta_week=round(total_bats * 0.05)),
        active_swaps_today=ActiveSwapsToday(value=swaps_val, delta_pct_vs_yesterday=swaps_delta_pct),
        stations_online=StationsOnline(
            online=online_count,
            total=len(stations),
            need_attention=warning_count + critical_count + offline_count,
        ),
        shortage_alerts=ShortageAlerts(
            total=critical_count + warning_count,
            critical=critical_count,
            warning=warning_count,
        ),
        avg_swap_time_min=AvgSwapTimeMin(value=avg_swap_time_val, delta_pct=-12),
        fleet_utilization_pct=FleetUtilizationPct(value=fleet_util, delta_vs_target=5),
        prediction_accuracy_pct=PredictionAccuracyPct(value=94.2, model_version="3rike AI v3.2"),
        revenue_today=RevenueToday(value=int(revenue), currency="NGN", delta_pct_vs_forecast=23),
    )


@router.get("/dashboard/heatmap", response_model=HeatmapResponse)
def get_dashboard_heatmap(
    window: str = Query("live"),
    db: Session = Depends(get_db),
):
    stations = db.query(Station).all()
    coords = normalize_coords(stations)
    hours_map = {"live": 1, "24h": 24, "7d": 168}
    window_hours = hours_map.get(window, 1)
    since = datetime.now(timezone.utc) - timedelta(hours=window_hours)

    nodes = []
    for s in stations:
        off = is_offline(s.station_id)
        st = "offline" if off else station_status(s.max_capacity, s.current_batteries)
        x, y = coords.get(s.station_id, (50, 50))
        swaps_in_window = (
            db.query(func.sum(SwapEvent.swaps_count))
            .filter(SwapEvent.station_id == s.station_id, SwapEvent.recorded_at >= since)
            .scalar() or 0
        )
        capacity_factor = s.current_batteries / max(s.max_capacity, 1)
        demand = min(100, max(0, int(swaps_in_window / max(s.max_capacity, 1) * 10) + int((1 - capacity_factor) * 60)))
        demand = demand if not off else 0
        nodes.append(HeatNode(
            station_id=s.station_id,
            name=s.name,
            x=x, y=y,
            lat=s.lat, lng=s.lng,
            demand=demand,
            status=st,
        ))

    return HeatmapResponse(
        window=window,
        generated_at=datetime.now(timezone.utc),
        nodes=nodes,
    )


@router.get("/alerts", response_model=AlertListResponse)
def get_alerts(
    status: str = Query(None),
    limit: int = Query(20),
    db: Session = Depends(get_db),
):
    stations = db.query(Station).all()
    alerts = []
    for i, s in enumerate(stations):
        off = is_offline(s.station_id)
        st = "offline" if off else station_status(s.max_capacity, s.current_batteries)
        if status and st != status:
            continue
        if st == "critical":
            msg = f"Only {s.current_batteries} batteries left, demand surge expected"
        elif st == "warning":
            msg = f"Running low: {s.current_batteries}/{s.max_capacity} batteries remaining"
        elif st == "offline":
            msg = f"Station offline, {s.current_batteries} batteries stranded"
        else:
            continue
        alerts.append(AlertItem(
            id=f"alt_{i+1:02d}",
            station_id=s.station_id,
            station=s.name,
            status=st,
            message=msg,
            created_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 30)),
        ))

    alerts.sort(key=lambda a: a.created_at, reverse=True)
    return AlertListResponse(total=len(alerts), items=alerts[:limit])
