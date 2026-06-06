import csv
import random
from datetime import datetime, timedelta

from app.database import engine, SessionLocal
from app.models import Base, Station, SwapEvent

NIGERIAN_STATIONS = [
    {"station_id": "wuse", "name": "Wuse Station", "lat": 9.0765, "lng": 7.3986},
    {"station_id": "garki", "name": "Garki Station", "lat": 9.0398, "lng": 7.4826},
    {"station_id": "asokoro", "name": "Asokoro Station", "lat": 9.0456, "lng": 7.5192},
    {"station_id": "maitama", "name": "Maitama Station", "lat": 9.0833, "lng": 7.4833},
    {"station_id": "gwarinpa", "name": "Gwarinpa Station", "lat": 9.1000, "lng": 7.4167},
    {"station_id": "kubwa", "name": "Kubwa Station", "lat": 9.0833, "lng": 7.3333},
]


def _swap_pattern(hour: int, day_of_week: int, base: int = 15) -> int:
    morning_peak = 7 <= hour <= 9
    evening_peak = 16 <= hour <= 19
    is_weekend = day_of_week >= 5

    if is_weekend:
        multiplier = 0.6
    elif morning_peak:
        multiplier = 2.0
    elif evening_peak:
        multiplier = 2.2
    elif 22 <= hour or hour <= 5:
        multiplier = 0.2
    else:
        multiplier = 0.8

    noise = random.gauss(0, 3)
    return max(0, int(round(base * multiplier + noise)))


def generate_swap_csv(path: str, days: int = 14):
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    start = now - timedelta(days=days)

    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["station_id", "ds", "y"])
        for station in NIGERIAN_STATIONS:
            for i in range(days * 24):
                ts = start + timedelta(hours=i)
                swaps = _swap_pattern(ts.hour, ts.weekday())
                writer.writerow([station["station_id"], ts.isoformat(), swaps])


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing = db.query(Station).count()
    if existing > 0:
        db.close()
        return

    for s in NIGERIAN_STATIONS:
        station = Station(
            station_id=s["station_id"],
            name=s["name"],
            lat=s["lat"],
            lng=s["lng"],
            current_batteries=random.randint(20, 40),
            max_capacity=50,
        )
        db.add(station)
    db.commit()

    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    start = now - timedelta(days=14)
    for station in NIGERIAN_STATIONS:
        for i in range(14 * 24):
            ts = start + timedelta(hours=i)
            swaps = _swap_pattern(ts.hour, ts.weekday(), base=random.randint(10, 20))
            db.add(SwapEvent(station_id=station["station_id"], recorded_at=ts, swaps_count=swaps))
    db.commit()
    db.close()
    print(f"Seeded {len(NIGERIAN_STATIONS)} stations with 14 days of swap data.")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "csv":
        generate_swap_csv("swap_data.csv")
        print("Generated swap_data.csv")
    else:
        seed_database()
