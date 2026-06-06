from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database import get_db
from app.models import Prediction
from conftest import TestingSessionLocal, override_get_db

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def test_forecast_empty():
    resp = client.get("/stations/wuse/forecast")
    assert resp.status_code == 404
    assert "No predictions" in resp.json()["detail"]


def test_forecast_with_data():
    db = TestingSessionLocal()
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    for i in range(24):
        db.add(Prediction(
            station_id="wuse",
            hour=now + timedelta(hours=i + 1),
            predicted_demand=10 + i,
        ))
    db.commit()
    db.close()

    resp = client.get("/stations/wuse/forecast")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 24
    assert data[0]["predicted_demand"] == 10


def test_forecast_unknown_station():
    resp = client.get("/stations/unknown/forecast")
    assert resp.status_code == 404


def test_rebalance_empty():
    resp = client.get("/rebalance")
    assert resp.status_code == 200
    assert resp.json() == []


def test_rebalance_with_predictions():
    db = TestingSessionLocal()
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    db.add(Prediction(station_id="wuse", hour=now + timedelta(hours=1), predicted_demand=100))
    db.commit()
    db.close()

    resp = client.get("/rebalance")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert data[0]["to_station"] == "wuse"
