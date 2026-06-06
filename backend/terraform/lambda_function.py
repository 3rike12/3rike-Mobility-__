import json
import os
import boto3
import psycopg2
from datetime import datetime, timedelta
from typing import Any

DATABASE_URL = os.environ["DATABASE_URL"]
AWS_REGION = os.environ["AWS_REGION"]
S3_BUCKET = os.environ["S3_BUCKET"]
BEDROCK_MODEL = os.environ.get("BEDROCK_MODEL", "anthropic.claude-3-haiku-20240307-v1:0")

bedrock = boto3.client("bedrock-runtime", region_name=AWS_REGION)
s3 = boto3.client("s3", region_name=AWS_REGION)


def get_db_connection():
    return psycopg2.connect(DATABASE_URL)


def fetch_station_history(cursor, station_id: str, days: int = 14) -> list[dict]:
    cursor.execute(
        """
        SELECT recorded_at, swaps_count
        FROM swap_events
        WHERE station_id = %s AND recorded_at >= NOW() - INTERVAL '%s days'
        ORDER BY recorded_at
        """,
        (station_id, days),
    )
    return [
        {"hour": str(row[0]), "swaps": row[1]}
        for row in cursor.fetchall()
    ]


def call_bedrock(station_id: str, history: list[dict]) -> list[int]:
    lines = "\n".join(f"{h['hour']},{h['swaps']}" for h in history[-336:])
    prompt = (
        f"You are a demand forecasting model for electric bike battery swap stations.\n\n"
        f"Here is the last 14 days of hourly swap data for {station_id} (hour,swaps):\n{lines}\n\n"
        f"Predict the number of battery swaps for each of the next 24 hours.\n"
        f"Return ONLY a valid JSON array of 24 integers. No explanation."
    )

    response = bedrock.invoke_model(
        modelId=BEDROCK_MODEL,
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 300,
            "messages": [{"role": "user", "content": prompt}],
        }),
    )
    body = json.loads(response["body"].read())
    return json.loads(body["content"][0]["text"])


def fallback_forecast(history: list[dict]) -> list[int]:
    hourly_totals: dict[str, list[int]] = {}
    for h in history:
        hour_key = h["hour"].split(" ")[1].split(":")[0]
        hourly_totals.setdefault(hour_key, []).append(h["swaps"])

    predictions = []
    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    for i in range(24):
        h = (now + timedelta(hours=i + 1)).strftime("%H")
        vals = hourly_totals.get(h, [10])
        predictions.append(int(round(sum(vals) / len(vals))))
    return predictions


def handler(event: dict, context: Any) -> dict:
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT station_id FROM stations")
    station_ids = [row[0] for row in cur.fetchall()]

    for station_id in station_ids:
        history = fetch_station_history(cur, station_id)
        try:
            values = call_bedrock(station_id, history)
        except Exception:
            values = fallback_forecast(history)

        now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        for i, val in enumerate(values):
            cur.execute(
                """
                INSERT INTO predictions (station_id, hour, predicted_demand, generated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (station_id, hour) DO UPDATE
                SET predicted_demand = %s, generated_at = NOW()
                """,
                (station_id, now + timedelta(hours=i + 1), int(val), int(val)),
            )

    conn.commit()
    cur.close()
    conn.close()

    return {"statusCode": 200, "body": json.dumps({"stations_updated": len(station_ids)})}
