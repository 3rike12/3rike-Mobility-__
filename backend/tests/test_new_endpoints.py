from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone
from app.main import app
from app.database import get_db
from conftest import TestingSessionLocal, override_get_db

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_dashboard_overview():
    resp = client.get("/dashboard/overview")
    assert resp.status_code == 200
    data = resp.json()
    assert "totalBatteries" in data
    assert "activeSwapsToday" in data
    assert "stationsOnline" in data
    assert "shortageAlerts" in data
    assert "revenueToday" in data
    assert data["stationsOnline"]["total"] == 25


def test_dashboard_heatmap():
    resp = client.get("/dashboard/heatmap?window=live")
    assert resp.status_code == 200
    data = resp.json()
    assert data["window"] == "live"
    assert "nodes" in data
    assert len(data["nodes"]) == 25
    assert "stationId" in data["nodes"][0]
    assert "demand" in data["nodes"][0]


def test_dashboard_heatmap_24h():
    resp = client.get("/dashboard/heatmap?window=24h")
    assert resp.status_code == 200
    assert resp.json()["window"] == "24h"


def test_alerts():
    resp = client.get("/alerts")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data
    assert len(data["items"]) > 0
    assert "stationId" in data["items"][0]
    assert "message" in data["items"][0]


def test_alerts_filter_status():
    resp = client.get("/alerts?status=critical")
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        assert item["status"] == "critical"


def test_forecast_stats():
    resp = client.get("/forecast/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "modelAccuracyPct" in data
    assert "modelVersion" in data
    assert "predictionsToday" in data
    assert "nextUpdateInSeconds" in data


def test_forecast_series():
    resp = client.get("/forecast/series?horizon=24h&interval=1h")
    assert resp.status_code == 200
    data = resp.json()
    assert "unitMax" in data
    assert "nowAt" in data
    assert "points" in data
    assert len(data["points"]) > 0
    assert "t" in data["points"][0]
    assert "predicted" in data["points"][0]


def test_forecast_predictions():
    resp = client.get("/forecast/predictions?horizon=6h")
    assert resp.status_code == 200
    data = resp.json()
    assert data["horizon"] == "6h"
    assert "items" in data
    for item in data["items"]:
        assert "stationId" in item
        assert "kind" in item
        assert "recommendation" in item


def test_forecast_insights():
    resp = client.get("/forecast/insights")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert len(data["items"]) == 3
    for item in data["items"]:
        assert "id" in item
        assert "type" in item
        assert "title" in item
        assert "body" in item


def test_redistribution_stats():
    resp = client.get("/redistribution/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "pendingTransfers" in data
    assert "inTransit" in data
    assert "completedToday" in data
    assert "fleet" in data


def test_redistribution_routes():
    resp = client.get("/redistribution/routes")
    assert resp.status_code == 200
    data = resp.json()
    assert "generatedAt" in data
    assert "nodes" in data
    assert "routes" in data
    assert "vehicles" in data


def test_transfers():
    resp = client.get("/transfers")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    for item in data["items"]:
        assert "id" in item
        assert "fromStationId" in item
        assert "toStationId" in item
        assert "status" in item
        assert "batteries" in item


def test_post_transfer():
    resp = client.post("/transfers", json={
        "fromStationId": "vi",
        "toStationId": "wuse",
        "batteries": 5,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["fromStationId"] == "vi"
    assert data["toStationId"] == "wuse"
    assert data["batteries"] == 5


def test_post_transfer_insufficient_batteries():
    resp = client.post("/transfers", json={
        "fromStationId": "vi",
        "toStationId": "wuse",
        "batteries": 9999,
    })
    assert resp.status_code == 422


def test_post_transfer_unknown_station():
    resp = client.post("/transfers", json={
        "fromStationId": "nonexistent",
        "toStationId": "wuse",
        "batteries": 5,
    })
    assert resp.status_code == 404


def test_redistribution_optimize():
    resp = client.post("/redistribution/optimize", json={
        "horizon": "6h",
        "autoApply": False,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "proposed" in data
    assert "applied" in data
    assert data["applied"] is False


def test_redistribution_optimize_auto_apply():
    resp = client.post("/redistribution/optimize", json={
        "horizon": "6h",
        "autoApply": True,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "proposed" in data or data["applied"] is True


def test_settings():
    resp = client.get("/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert "organization" in data
    assert "thresholds" in data
    assert "ai" in data
    assert "notifications" in data
    assert data["organization"]["name"] == "3rike Lagos"


def test_patch_settings():
    resp = client.patch("/settings", json={
        "critical_below_pct": 10,
        "sms_field_team": 1,
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["thresholds"]["criticalBelowPct"] == 10
    assert data["notifications"]["smsFieldTeam"] is True


def test_me():
    resp = client.get("/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "usr_ada"
    assert data["name"] == "Ada Okafor"
    assert "role" in data
    assert "systemStatus" in data


def test_post_station():
    resp = client.post("/stations", json={
        "name": "New Test Station",
        "capacity": 30,
        "lat": 6.5,
        "lng": 3.4,
        "address": "Test Location, Lagos",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "New Test Station"
    assert data["capacity"] == 30
    assert data["status"] == "critical"  # 0/30 batteries → ratio 0 → critical


def test_station_detail_has_extra_fields():
    resp = client.get("/stations/ikeja")
    assert resp.status_code == 200
    data = resp.json()
    assert "lat" in data
    assert "lng" in data
    assert "address" in data
    assert "updatedAt" in data


def test_transfers_filter_by_status():
    resp = client.get("/transfers?status=pending")
    assert resp.status_code == 200
    for item in resp.json()["items"]:
        assert item["status"] == "pending"
