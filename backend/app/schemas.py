from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional


def to_camel(s: str) -> str:
    parts = s.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


class CamelCaseModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# --- Error ---
class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[list] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


# --- Dashboard ---
class TotalBatteries(CamelCaseModel):
    value: int
    delta_week: int


class ActiveSwapsToday(CamelCaseModel):
    value: int
    delta_pct_vs_yesterday: int


class StationsOnline(CamelCaseModel):
    online: int
    total: int
    need_attention: int


class ShortageAlerts(CamelCaseModel):
    total: int
    critical: int
    warning: int


class AvgSwapTimeMin(CamelCaseModel):
    value: float
    delta_pct: int


class FleetUtilizationPct(CamelCaseModel):
    value: int
    delta_vs_target: int


class PredictionAccuracyPct(CamelCaseModel):
    value: float
    model_version: str


class RevenueToday(CamelCaseModel):
    value: int
    currency: str
    delta_pct_vs_forecast: int


class DashboardOverview(CamelCaseModel):
    total_batteries: TotalBatteries
    active_swaps_today: ActiveSwapsToday
    stations_online: StationsOnline
    shortage_alerts: ShortageAlerts
    avg_swap_time_min: AvgSwapTimeMin
    fleet_utilization_pct: FleetUtilizationPct
    prediction_accuracy_pct: PredictionAccuracyPct
    revenue_today: RevenueToday


# --- Heatmap ---
class HeatNode(CamelCaseModel):
    station_id: str
    name: str
    x: float
    y: float
    lat: Optional[float] = None
    lng: Optional[float] = None
    demand: int
    status: str


class HeatmapResponse(CamelCaseModel):
    window: str
    generated_at: datetime
    nodes: list[HeatNode]


# --- Alerts ---
class AlertItem(CamelCaseModel):
    id: str
    station_id: str
    station: str
    status: str
    message: str
    created_at: datetime


class AlertListResponse(CamelCaseModel):
    total: int
    items: list[AlertItem]


# --- Stations ---
class NetworkSummary(CamelCaseModel):
    total_stations: int
    online: int
    total_inventory: int
    total_capacity: int
    critical: int
    warning: int


class StationListItem(CamelCaseModel):
    id: str
    name: str
    status: str
    inventory: Optional[int] = None
    capacity: int
    swaps_today: Optional[int] = None
    est_empty_minutes: Optional[int] = None
    last_online_at: Optional[datetime] = None


class StationDetail(StationListItem):
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    updated_at: Optional[datetime] = None


class StationListResponse(CamelCaseModel):
    summary: NetworkSummary
    items: list[StationListItem]
    next_cursor: Optional[str] = None
    total: int


class StationCreate(CamelCaseModel):
    name: str
    capacity: int
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None


# --- Forecast ---
class ForecastStats(CamelCaseModel):
    model_accuracy_pct: float
    model_version: str
    predictions_today: int
    predictions_correct_pct: float
    shortages_prevented_this_week: int
    next_update_in_seconds: int


class ForecastSeriesPoint(CamelCaseModel):
    t: datetime
    predicted: int
    actual: Optional[int] = None


class RiskWindow(CamelCaseModel):
    start_at: datetime
    end_at: datetime
    severity: str


class ForecastSeries(CamelCaseModel):
    unit_max: int
    now_at: datetime
    points: list[ForecastSeriesPoint]
    risk_windows: list[RiskWindow]


class Recommendation(CamelCaseModel):
    action: str
    units: Optional[int] = None


class PredictionItem(CamelCaseModel):
    station_id: str
    station: str
    status: str
    kind: str
    eta_at: Optional[datetime] = None
    label: str
    note: str
    recommendation: Recommendation


class PredictionList(CamelCaseModel):
    horizon: str
    items: list[PredictionItem]


class InsightItem(CamelCaseModel):
    id: str
    type: str
    title: str
    body: str


class InsightList(CamelCaseModel):
    items: list[InsightItem]


# --- Redistribution ---
class InTransit(CamelCaseModel):
    count: int
    batteries_en_route: int


class CompletedToday(CamelCaseModel):
    count: int
    batteries_moved: int


class Fleet(CamelCaseModel):
    active: int
    total: int


class RedistributionStats(CamelCaseModel):
    pending_transfers: int
    in_transit: InTransit
    completed_today: CompletedToday
    fleet: Fleet


class MapNode(CamelCaseModel):
    id: str
    label: str
    kind: str
    x: float
    y: float
    lat: Optional[float] = None
    lng: Optional[float] = None


class RouteLine(CamelCaseModel):
    id: str
    from_id: str
    to_id: str
    vehicle_id: str


class VehiclePosition(CamelCaseModel):
    id: str
    label: str
    x: float
    y: float
    units: int
    transfer_id: str


class RouteMap(CamelCaseModel):
    generated_at: datetime
    nodes: list[MapNode]
    routes: list[RouteLine]
    vehicles: list[VehiclePosition]


class TransferItem(CamelCaseModel):
    id: str
    vehicle_id: str
    from_station_id: str
    to_station_id: str
    route_label: str
    status: str
    batteries: int
    eta_at: Optional[datetime] = None
    departs_at: Optional[datetime] = None
    progress_pct: int


class TransferList(CamelCaseModel):
    items: list[TransferItem]
    next_cursor: Optional[str] = None


class TransferCreate(CamelCaseModel):
    from_station_id: str
    to_station_id: str
    batteries: int
    scheduled_at: Optional[datetime] = None
    vehicle_id: Optional[str] = None


class OptimizeRequest(CamelCaseModel):
    horizon: str = "6h"
    auto_apply: bool = False


class ProposedTransfer(CamelCaseModel):
    from_station_id: str
    to_station_id: str
    batteries: int
    reason: str
    est_improvement_pct: int
    transfer_id: Optional[str] = None


class OptimizeResponse(CamelCaseModel):
    proposed: list[ProposedTransfer]
    applied: bool


# --- Settings ---
class Organization(CamelCaseModel):
    name: str
    region: str
    currency: str
    timezone: str


class Thresholds(CamelCaseModel):
    critical_below_pct: int
    warning_below_pct: int
    auto_generate_alerts: bool
    predictive_warnings: bool


class AiSettings(CamelCaseModel):
    forecast_horizon: str
    auto_redistribute_surplus: bool
    weather_adjusted: bool


class Notifications(CamelCaseModel):
    critical_alerts: bool
    daily_digest: bool
    sms_field_team: bool
    weekly_report: bool


class SettingsOut(CamelCaseModel):
    organization: Organization
    thresholds: Thresholds
    ai: AiSettings
    notifications: Notifications


class UserProfile(CamelCaseModel):
    id: str
    name: str
    role: str
    site: str
    avatar_url: Optional[str] = None
    build_version: str
    system_status: str


# --- Legacy (keep for backward compat) ---
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
