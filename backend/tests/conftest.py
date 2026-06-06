import pytest
from sqlalchemy import create_engine, StaticPool, event
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import Station, Prediction, OrganizationSettings
from app.seed import ALL_STATIONS

TEST_DATABASE_URL = "sqlite://"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(engine, "connect")
def _sqlite_compat(dbapi_con, con_record):
    dbapi_con.create_function("date_trunc", 2, lambda precision, ts: ts[:13] + ":00:00" if ts else ts)


TestingSessionLocal = sessionmaker(bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    for s in ALL_STATIONS:
        db.add(Station(
            station_id=s["station_id"],
            name=s["name"],
            lat=s["lat"],
            lng=s["lng"],
            current_batteries=25,
            max_capacity=50,
        ))
    db.add(OrganizationSettings())
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


app.dependency_overrides[get_db] = override_get_db
