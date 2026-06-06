from app.services.rebalance import compute_rebalance
from app.models import Station, Prediction
from datetime import datetime, timedelta
from conftest import TestingSessionLocal


def test_rebalance_no_predictions():
    db = TestingSessionLocal()
    result = compute_rebalance(db)
    db.close()
    assert result == []


def test_rebalance_with_shortfall():
    db = TestingSessionLocal()
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)

    wuse = db.query(Station).filter(Station.station_id == "wuse").first()
    wuse.current_batteries = 2

    garki = db.query(Station).filter(Station.station_id == "garki").first()
    garki.current_batteries = 40

    for i in range(24):
        db.add(Prediction(station_id="wuse", hour=now + timedelta(hours=i + 1), predicted_demand=10))
    db.commit()

    result = compute_rebalance(db)
    db.close()

    assert len(result) > 0
    assert result[0].to_station == "wuse"
    assert result[0].batteries_to_move > 0
