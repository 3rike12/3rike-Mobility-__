import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from app.services.forecast import predict_station, _fallback_forecast


def test_fallback_forecast():
    now = datetime.utcnow()
    history = [
        {"hour": (now - timedelta(hours=i)).strftime("%Y-%m-%d %H:00:00"), "swaps": 15}
        for i in range(168)
    ]
    result = _fallback_forecast(history)
    assert len(result) == 24
    assert all(isinstance(v, int) for v in result)


def test_fallback_forecast_empty():
    result = _fallback_forecast([])
    assert len(result) == 24
    assert all(v == 10 for v in result)


@patch("app.services.forecast.bedrock")
def test_bedrock_success(mock_bedrock):
    mock_bedrock.invoke_model.return_value = {
        "body": MagicMock(
            read=lambda: b'{"content": [{"text": "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]"}]}'
        )
    }

    now = datetime.utcnow()
    history = [
        {"hour": (now - timedelta(hours=i)).strftime("%Y-%m-%d %H:00:00"), "swaps": 10}
        for i in range(336)
    ]

    result = predict_station("wuse", history)
    assert len(result) == 24
    assert result[0].station_id == "wuse"
    assert result[0].predicted_demand == 1


@patch("app.services.forecast.bedrock")
def test_bedrock_failure_fallback(mock_bedrock):
    mock_bedrock.invoke_model.side_effect = Exception("Bedrock down")

    now = datetime.utcnow()
    history = [
        {"hour": (now - timedelta(hours=i)).strftime("%Y-%m-%d %H:00:00"), "swaps": 10}
        for i in range(168)
    ]

    result = predict_station("wuse", history)
    assert len(result) == 24
    assert result[0].station_id == "wuse"
