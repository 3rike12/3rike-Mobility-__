import csv
import random
from datetime import datetime, timedelta, timezone

from app.database import engine, SessionLocal
from app.models import Base, Station, SwapEvent, Prediction, FleetTrip, TransportTrip
from app.services.forecast import _fallback_forecast

LAGOS_STATIONS = [
    {"station_id": "vi", "name": "Victoria Island Hub", "lat": 6.4281, "lng": 3.4219},
    {"station_id": "lekki1", "name": "Lekki Phase 1", "lat": 6.4398, "lng": 3.4547},
    {"station_id": "ajah", "name": "Ajah Station", "lat": 6.4698, "lng": 3.5956},
    {"station_id": "ikeja", "name": "Ikeja City Mall", "lat": 6.6017, "lng": 3.3515},
    {"station_id": "maryland", "name": "Maryland Mall", "lat": 6.5683, "lng": 3.3589},
    {"station_id": "yaba", "name": "Yaba Tech Campus", "lat": 6.5149, "lng": 3.3758},
    {"station_id": "surulere", "name": "Surulere Stadium", "lat": 6.5000, "lng": 3.3580},
    {"station_id": "allen", "name": "Allen Junction", "lat": 6.6025, "lng": 3.3483},
    {"station_id": "ikoyi", "name": "Ikoyi Station", "lat": 6.4507, "lng": 3.4346},
    {"station_id": "apapa", "name": "Apapa Station", "lat": 6.4500, "lng": 3.3667},
    {"station_id": "festac", "name": "Festac Station", "lat": 6.4702, "lng": 3.2840},
    {"station_id": "ogba", "name": "Ogba Station", "lat": 6.6375, "lng": 3.3451},
    {"station_id": "ojota", "name": "Ojota Station", "lat": 6.5822, "lng": 3.3871},
    {"station_id": "oshodi", "name": "Oshodi Station", "lat": 6.5547, "lng": 3.3480},
    {"station_id": "isolo", "name": "Isolo Station", "lat": 6.5400, "lng": 3.3200},
    {"station_id": "agege", "name": "Agege Station", "lat": 6.6225, "lng": 3.3250},
    {"station_id": "gbagada", "name": "Gbagada Station", "lat": 6.5386, "lng": 3.3883},
    {"station_id": "ogudu", "name": "Ogudu Station", "lat": 6.5639, "lng": 3.3875},
    {"station_id": "jakande", "name": "Jakande Station", "lat": 6.4786, "lng": 3.3672},
    {"station_id": "ilupeju", "name": "Ilupeju Station", "lat": 6.5444, "lng": 3.3622},
]

ABUJA_STATIONS = [
    {"station_id": "wuse", "name": "Wuse Station", "lat": 9.0765, "lng": 7.3986},
    {"station_id": "garki", "name": "Garki Station", "lat": 9.0398, "lng": 7.4826},
    {"station_id": "asokoro", "name": "Asokoro Station", "lat": 9.0456, "lng": 7.5192},
    {"station_id": "maitama", "name": "Maitama Station", "lat": 9.0833, "lng": 7.4833},
    {"station_id": "gwarinpa", "name": "Gwarinpa Station", "lat": 9.1000, "lng": 7.4167},
]

ALL_STATIONS = LAGOS_STATIONS + ABUJA_STATIONS

VEHICLE_TYPES = ["danfo", "keke", "okada"]
DANFO_ROUTES = [
    ("Mile 2", "CMS"),
    ("Oshodi", "Mile 12"),
    ("Ikeja", "Oshodi"),
    ("Oyigbo", "Eberi"),
    ("Mile 2", "Badagry"),
    ("Oshodi", "Abule Egba"),
    ("Ikeja", "Maryland"),
    ("Yaba", "Idumota"),
    ("VI", "Marina"),
    ("Lekki", "CMS"),
]
KERE_ROUTES = [
    ("Mile 12", "Ketu"),
    ("Oshodi", "Isolo"),
    ("Ikeja", "Ojota"),
    ("Yaba", "Ebute Metta"),
    ("Ajah", "Sangotedo"),
]
OKADA_HOTSPOTS = [
    ("Ikeja", "Oshodi"),
    ("Yaba", "Surulere"),
    ("VI", "Lekki"),
    ("Maryland", "Ikeja"),
    ("Ojota", "Ikorodu"),
    ("Agege", "Ikeja"),
    ("Apapa", "Surulere"),
    ("Oshodi", "Mile 2"),
]


def _swap_pattern(hour: int, day_of_week: int, base: float = 15) -> int:
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


def generate_swap_csv(path: str, days: int = 90):
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    start = now - timedelta(days=days)
    with open(path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["station_id", "ds", "y"])
        for station in ALL_STATIONS:
            for i in range(days * 24):
                ts = start + timedelta(hours=i)
                swaps = _swap_pattern(ts.hour, ts.weekday(), base=random.uniform(8, 22))
                writer.writerow([station["station_id"], ts.isoformat(), swaps])
    print(f"Generated {path} with {len(ALL_STATIONS)} stations × {days} days")


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing = db.query(Station).count()
    if existing > 0:
        print("Database already seeded, skipping.")
        db.close()
        return

    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    # --- Stations ---
    for s in ALL_STATIONS:
        db.add(Station(
            station_id=s["station_id"],
            name=s["name"],
            lat=s["lat"],
            lng=s["lng"],
            current_batteries=random.randint(10, 45),
            max_capacity=50,
        ))
    db.flush()
    print(f"Seeded {len(ALL_STATIONS)} stations")

    # --- Swap events (90 days) ---
    start = now - timedelta(days=90)
    batch = []
    for station in ALL_STATIONS:
        for i in range(90 * 24):
            ts = start + timedelta(hours=i)
            swaps = _swap_pattern(ts.hour, ts.weekday(), base=random.uniform(8, 22))
            batch.append(SwapEvent(station_id=station["station_id"], recorded_at=ts, swaps_count=swaps))
    db.bulk_save_objects(batch)
    db.commit()
    print(f"Seeded {len(batch)} swap events (90 days)")

    # --- Fleet trips (Problem 2) ---
    vehicles = [f"VH-{i:02d}" for i in range(1, 16)]
    drivers = ["Andrew O.", "Chidi N.", "Bola K.", "Funmi A.", "Emeka J.",
               "Tunde B.", "Ngozi E.", "Segun A.", "Ifeanyi O.", "Zainab D.",
               "Kelechi M.", "Rita U.", "Musa I.", "Grace O.", "Tobi A."]
    fleet_routes = [
        ("Ikeja Warehouse", "VI Hub"), ("Ikeja Warehouse", "Lekki Depot"),
        ("Ikeja Warehouse", "Mile 2"), ("Ikeja Warehouse", "Oshodi Market"),
        ("Ikeja Warehouse", "Surulere"), ("Ikeja Warehouse", "Yaba Tech"),
        ("Ikeja Warehouse", "Ikoyi"), ("Ikeja Warehouse", "Apapa Wharf"),
        ("Ikeja Warehouse", "Maryland"), ("VI Hub", "Lekki Depot"),
    ]
    fleet_batch = []
    for v in range(15):
        daily_trips = random.randint(2, 4)
        for d in range(60):
            for t in range(daily_trips):
                route = random.choice(fleet_routes)
                dist = round(random.uniform(5, 35), 1)
                fuel_expected = round(dist * 0.35, 1)
                stolen = random.random() < 0.15
                fuel_actual = round(fuel_expected * (1 + random.uniform(0, 0.4) if stolen else random.uniform(-0.05, 0.05)), 1)
                deviation = round(random.uniform(0, 6) if stolen else random.uniform(0, 0.8), 2)
                trip_start = now - timedelta(days=60 - d, hours=random.randint(6, 18))
                trip_end = trip_start + timedelta(hours=random.uniform(0.5, 2.5))
                fleet_batch.append(FleetTrip(
                    vehicle_id=vehicles[v], driver=drivers[v],
                    route_from=route[0], route_to=route[1],
                    distance_km=dist, fuel_used_l=fuel_actual, fuel_expected_l=fuel_expected,
                    started_at=trip_start, ended_at=trip_end,
                    deviation_km=deviation, unauthorized_stop=random.randint(0, 3),
                    status=random.choice(["completed", "completed", "completed", "pending"]),
                ))
    db.bulk_save_objects(fleet_batch)
    db.commit()
    print(f"Seeded {len(fleet_batch)} fleet trips")

    # --- Transport trips (Problem 10) ---
    transport_batch = []
    for vehicle_type in VEHICLE_TYPES:
        routes = DANFO_ROUTES if vehicle_type == "danfo" else KERE_ROUTES if vehicle_type == "keke" else OKADA_HOTSPOTS
        for veh_id in range(1, 31):
            for d in range(60):
                trips_per_day = random.randint(5, 15) if vehicle_type == "okada" else random.randint(3, 8)
                for t in range(trips_per_day):
                    route = random.choice(routes)
                    dist = round(random.uniform(2, 25), 1)
                    if vehicle_type == "danfo":
                        pax = random.randint(8, 18)
                        fare = round(pax * random.uniform(100, 300), 0)
                    elif vehicle_type == "keke":
                        pax = random.randint(1, 4)
                        fare = round(pax * random.uniform(50, 150), 0)
                    else:
                        pax = 1
                        fare = round(random.uniform(100, 500), 0)
                    trip_start = now - timedelta(days=60 - d, hours=random.randint(5, 21))
                    trip_end = trip_start + timedelta(hours=random.uniform(0.15, 1.5))
                    transport_batch.append(TransportTrip(
                        vehicle_type=vehicle_type,
                        vehicle_id=f"{vehicle_type.upper()}-{veh_id:03d}",
                        route_name=f"{route[0]} → {route[1]}",
                        passenger_count=pax, distance_km=dist,
                        started_at=trip_start, ended_at=trip_end,
                        fare_collected=fare,
                    ))
    db.bulk_save_objects(transport_batch)
    db.commit()
    print(f"Seeded {len(transport_batch)} transport trips")

    # --- Initial predictions (fallback moving-average — prevents 404) ---
    pred_batch = []
    for station in ALL_STATIONS:
        history = (
            db.query(SwapEvent)
            .filter(SwapEvent.station_id == station["station_id"])
            .order_by(SwapEvent.recorded_at.desc())
            .limit(168)
            .all()
        )
        hist_dict = [
            {"hour": h.recorded_at.strftime("%Y-%m-%d %H:00:00"), "swaps": h.swaps_count}
            for h in history
        ]
        values = _fallback_forecast(hist_dict)
        for i, val in enumerate(values):
            pred_batch.append(Prediction(
                station_id=station["station_id"],
                hour=now + timedelta(hours=i + 1),
                predicted_demand=val,
            ))
    db.bulk_save_objects(pred_batch)
    db.commit()
    print(f"Seeded {len(pred_batch)} initial predictions (fallback)")

    db.close()
    print("Seed complete ✅")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "csv":
        generate_swap_csv("swap_data.csv")
    else:
        seed_database()
