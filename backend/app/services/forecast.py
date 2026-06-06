import json
import boto3
from datetime import datetime, timedelta
from typing import Optional

from app.config import settings
from app.models import Prediction


bedrock = boto3.client("bedrock-runtime", region_name=settings.aws_region)


def _build_prompt(station_id: str, history: list[dict]) -> str:
    lines = "\n".join(
        f"{h['hour']},{h['swaps']}" for h in history[-336:]  # last 14 days hourly
    )
    return f"""You are a demand forecasting model for electric bike battery swap stations.

Here is the last 14 days of hourly swap data for {station_id} (hour,swaps):
{lines}

Predict the number of battery swaps for each of the next 24 hours.
Return ONLY a valid JSON array of 24 integers. No explanation."""


def _call_bedrock(prompt: str) -> list[int]:
    response = bedrock.invoke_model(
        modelId=settings.bedrock_model_id,
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 300,
            "messages": [{"role": "user", "content": prompt}],
        }),
    )
    body = json.loads(response["body"].read())
    return json.loads(body["content"][0]["text"])


def _call_sagemaker(history: list[dict]) -> list[int]:
    if not settings.sagemaker_endpoint:
        return _fallback_forecast(history)

    runtime = boto3.client("sagemaker-runtime", region_name=settings.aws_region)
    target = [h["swaps"] for h in history[-168:]]  # last 7 days

    response = runtime.invoke_endpoint(
        EndpointName=settings.sagemaker_endpoint,
        ContentType="application/json",
        Body=json.dumps({
            "instances": [{"start": str(datetime.utcnow().date()), "target": target}]
        }),
    )
    result = json.loads(response["Body"].read())
    return result.get("predictions", [])[0] if isinstance(result, dict) else result


def _fallback_forecast(history: list[dict]) -> list[int]:
    df = {h["hour"]: h["swaps"] for h in history[-168:]}
    predictions = []
    now = datetime.utcnow()
    for i in range(24):
        hour_key = (now + timedelta(hours=i)).strftime("%Y-%m-%d %H:00:00")
        same_hour = [
            v for k, v in df.items()
            if k.split(" ")[1].split(":")[0] == hour_key.split(" ")[1].split(":")[0]
        ]
        avg = sum(same_hour) / len(same_hour) if same_hour else 10
        predictions.append(int(round(avg)))
    return predictions


def predict_station(
    station_id: str,
    history: list[dict],
) -> list[Prediction]:
    if settings.use_bedrock:
        try:
            prompt = _build_prompt(station_id, history)
            values = _call_bedrock(prompt)
        except Exception:
            values = _fallback_forecast(history)
    else:
        try:
            values = _call_sagemaker(history)
        except Exception:
            values = _fallback_forecast(history)

    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    predictions = []
    for i, val in enumerate(values):
        predictions.append(
            Prediction(
                station_id=station_id,
                hour=now + timedelta(hours=i + 1),
                predicted_demand=val,
                generated_at=datetime.utcnow(),
            )
        )
    return predictions
