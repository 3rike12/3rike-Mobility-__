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
    assert "summary" in data
    assert "items" in data
    assert len(data["items"]) == 25
    assert data["items"][0]["id"] == "vi"
    assert data["summary"]["totalStations"] == 25


def test_get_station_found():
    resp = client.get("/stations/wuse")
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Wuse Station"
    assert "id" in body
    assert "address" in body
    assert "updatedAt" in body


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
