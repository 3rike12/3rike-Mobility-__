from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_list_stations():
    resp = client.get("/stations")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 25
    assert data[0]["station_id"] == "vi"
    assert "lat" in data[0]


def test_get_station_found():
    resp = client.get("/stations/wuse")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Wuse Station"


def test_get_station_not_found():
    resp = client.get("/stations/unknown")
    assert resp.status_code == 404


def test_cors_headers():
    resp = client.options("/health", headers={
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    })
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "*"
