from app.seed import generate_swap_csv, NIGERIAN_STATIONS, _swap_pattern
import csv
import tempfile


def test_nigerian_stations_count():
    assert len(NIGERIAN_STATIONS) == 6


def test_swap_pattern_ranges():
    for hour in range(24):
        for dow in range(7):
            val = _swap_pattern(hour, dow, base=15)
            assert isinstance(val, int)
            assert val >= 0


def test_swap_pattern_weekend_lower():
    weekday_vals = sum(_swap_pattern(12, 0, 15) for _ in range(100))
    weekend_vals = sum(_swap_pattern(12, 5, 15) for _ in range(100))
    assert weekend_vals < weekday_vals * 1.5


def test_swap_pattern_peak_higher():
    off_peak = sum(_swap_pattern(3, 0, 15) for _ in range(100))
    peak = sum(_swap_pattern(8, 0, 15) for _ in range(100))
    assert peak > off_peak


def test_generate_csv():
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=True) as f:
        generate_swap_csv(f.name, days=14)
        with open(f.name, newline="") as csvfile:
            reader = csv.reader(csvfile)
            rows = list(reader)
            header = rows[0]
            assert header == ["station_id", "ds", "y"]
            total_rows = len(rows) - 1
            assert total_rows == 6 * 14 * 24
