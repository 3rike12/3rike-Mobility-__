# 3rike Swap — API Reference

> Base URL: `http://3.213.111.199:8000` (dev) · auth: not yet wired (Bearer token planned)
> All responses are JSON · keys are `camelCase` · timestamps are ISO-8601 UTC

---

## Health

**`GET /health`**

```json
{ "status": "ok" }
```

---

## Stations

### `GET /stations`

Returns network summary + paginated station list.

**Query params:** `?status=all|online|warning|critical|offline&q=<search>&limit=50`

```json
{
  "summary": {
    "totalStations": 25,
    "online": 18,
    "totalInventory": 847,
    "totalCapacity": 1250,
    "critical": 3,
    "warning": 4
  },
  "items": [
    {
      "id": "vi",
      "name": "Victoria Island Hub",
      "status": "critical",
      "inventory": 2,
      "capacity": 50,
      "swapsToday": 127,
      "estEmptyMinutes": 18,
      "lastOnlineAt": null
    },
    {
      "id": "festac",
      "name": "Festac Station",
      "status": "offline",
      "inventory": null,
      "capacity": 50,
      "swapsToday": null,
      "estEmptyMinutes": null,
      "lastOnlineAt": "2026-06-06T13:00:00Z"
    }
  ],
  "nextCursor": null,
  "total": 25
}
```

### `GET /stations/{id}`

```json
{
  "id": "ikeja",
  "name": "Ikeja City Mall",
  "status": "online",
  "inventory": 34,
  "capacity": 50,
  "swapsToday": 89,
  "estEmptyMinutes": 340,
  "lastOnlineAt": null,
  "lat": 6.6017,
  "lng": 3.3515,
  "address": "Ikeja, Lagos",
  "updatedAt": "2026-06-06T15:00:00Z"
}
```

### `POST /stations`

```json
// Request
{ "name": "Yaba Tech Campus", "capacity": 35, "lat": 6.5174, "lng": 3.3776, "address": "Yaba, Lagos" }

// Response 201 — same shape as GET /stations/{id}
```

---

## Dashboard

### `GET /dashboard/overview`

```json
{
  "totalBatteries":        { "value": 2847, "deltaWeek": 124 },
  "activeSwapsToday":      { "value": 1293, "deltaPctVsYesterday": 18 },
  "stationsOnline":        { "online": 18, "total": 25, "needAttention": 7 },
  "shortageAlerts":        { "total": 7, "critical": 3, "warning": 4 },
  "avgSwapTimeMin":        { "value": 2.4, "deltaPct": -12 },
  "fleetUtilizationPct":   { "value": 87, "deltaVsTarget": 5 },
  "predictionAccuracyPct": { "value": 94.2, "modelVersion": "3rike AI v3.2" },
  "revenueToday":          { "value": 1200000, "currency": "NGN", "deltaPctVsForecast": 23 }
}
```

### `GET /dashboard/heatmap`

**Query:** `?window=live|24h|7d`

```json
{
  "window": "live",
  "generatedAt": "2026-06-06T15:00:00Z",
  "nodes": [
    { "stationId": "vi", "name": "Victoria Island Hub", "x": 53, "y": 42, "lat": 6.4281, "lng": 3.4219, "demand": 80, "status": "critical" },
    { "stationId": "allen", "name": "Allen Junction", "x": 40, "y": 52, "demand": 70, "status": "online" }
  ]
}
```

### `GET /alerts`

**Query:** `?status=critical|warning|offline&limit=20`

```json
{
  "total": 7,
  "items": [
    { "id": "alt_01", "stationId": "vi", "station": "Victoria Island Hub", "status": "critical", "message": "Only 2 batteries left, demand surge expected", "createdAt": "2026-06-06T14:58:00Z" }
  ]
}
```

---

## Forecasting

### `GET /forecast/stats`

```json
{
  "modelAccuracyPct": 94.2,
  "modelVersion": "3rike AI v3.2",
  "predictionsToday": 2847,
  "predictionsCorrectPct": 98.1,
  "shortagesPreventedThisWeek": 23,
  "nextUpdateInSeconds": 272
}
```

### `GET /forecast/series`

**Query:** `?horizon=6h|12h|24h|7d&interval=1h`

```json
{
  "unitMax": 800,
  "nowAt": "2026-06-06T15:00:00Z",
  "points": [
    { "t": "2026-06-06T06:00:00Z", "predicted": 180, "actual": 165 },
    { "t": "2026-06-06T15:00:00Z", "predicted": 460, "actual": 455 },
    { "t": "2026-06-06T18:00:00Z", "predicted": 740, "actual": null }
  ],
  "riskWindows": [
    { "startAt": "2026-06-06T18:00:00Z", "endAt": "2026-06-06T21:00:00Z", "severity": "critical" }
  ]
}
```

### `GET /forecast/predictions`

**Query:** `?horizon=6h|12h|24h|7d`

```json
{
  "horizon": "6h",
  "items": [
    { "stationId": "vi", "station": "Victoria Island Hub", "status": "critical", "kind": "critical", "etaAt": null, "label": "Critical", "note": "Empty in 18 min at current rate", "recommendation": { "action": "Emergency dispatch", "units": null } },
    { "stationId": "allen", "station": "Allen Junction", "status": "online", "kind": "surplus", "etaAt": null, "label": "Surplus", "note": "Low demand expected tonight", "recommendation": { "action": "Redistribute", "units": 8 } }
  ]
}
```

### `GET /forecast/insights`

```json
{
  "items": [
    { "id": "ins_01", "type": "pattern", "title": "Pattern Detected", "body": "Peak demand typically occurs around 18:00. Evening hours (16-19) show highest swap density." },
    { "id": "ins_02", "type": "optimization", "title": "Optimization Opportunity", "body": "3 stations have consistent surplus. Reallocating 25 batteries could improve network efficiency by 12%." },
    { "id": "ins_03", "type": "risk", "title": "Risk Alert", "body": "2 station(s) critically low. Immediate dispatch recommended." }
  ]
}
```

---

## Redistribution

### `GET /redistribution/stats`

```json
{
  "pendingTransfers": 12,
  "inTransit":      { "count": 5, "batteriesEnRoute": 143 },
  "completedToday": { "count": 8, "batteriesMoved": 247 },
  "fleet":          { "active": 6, "total": 8 }
}
```

### `GET /redistribution/routes`

```json
{
  "generatedAt": "2026-06-06T15:00:00Z",
  "nodes": [
    { "id": "allen", "label": "Allen", "kind": "source", "x": 18, "y": 35, "lat": 6.61, "lng": 3.35 }
  ],
  "routes": [
    { "id": "rt_001", "fromId": "allen", "toId": "vi", "vehicleId": "VH-01" }
  ],
  "vehicles": [
    { "id": "VH-01", "label": "VH-01", "x": 39, "y": 52, "units": 25, "transferId": "trf_001" }
  ]
}
```

### `GET /transfers`

**Query:** `?status=pending|in_transit|completed|cancelled&limit=50`

```json
{
  "items": [
    { "id": "trf_001", "vehicleId": "VH-01", "fromStationId": "allen", "toStationId": "vi", "routeLabel": "Allen → Victoria Is.", "status": "in_transit", "batteries": 25, "etaAt": "2026-06-06T15:12:00Z", "departsAt": "2026-06-06T14:47:00Z", "progressPct": 72 }
  ],
  "nextCursor": null
}
```

### `POST /transfers`

```json
// Request
{ "fromStationId": "allen", "toStationId": "vi", "batteries": 25, "scheduledAt": "2026-06-06T16:00:00Z", "vehicleId": "VH-01" }

// Response 201 — same shape as GET /transfers item
// 422 if insufficient batteries at source
```

### `POST /redistribution/optimize`

```json
// Request
{ "horizon": "6h", "autoApply": false }

// Response 200
{
  "proposed": [
    { "fromStationId": "allen", "toStationId": "vi", "batteries": 25, "reason": "Victoria Is. forecast empty in 18m", "estImprovementPct": 12 }
  ],
  "applied": false
}
```

---

## Settings

### `GET /settings`

```json
{
  "organization": { "name": "3rike Lagos", "region": "Lagos", "currency": "NGN", "timezone": "Africa/Lagos" },
  "thresholds":   { "criticalBelowPct": 15, "warningBelowPct": 30, "autoGenerateAlerts": true, "predictiveWarnings": true },
  "ai":           { "forecastHorizon": "24h", "autoRedistributeSurplus": true, "weatherAdjusted": true },
  "notifications":{ "criticalAlerts": true, "dailyDigest": true, "smsFieldTeam": false, "weeklyReport": false }
}
```

### `PATCH /settings`

Send any partial subset — deep merged:

```json
// Request
{ "thresholds": { "criticalBelowPct": 12 }, "notifications": { "smsFieldTeam": true } }

// Response 200 — full settings object
```

---

## Profile

### `GET /me`

```json
{
  "id": "usr_ada",
  "name": "Ada Okafor",
  "role": "Operator",
  "site": "Lagos HQ",
  "avatarUrl": null,
  "buildVersion": "v3.2",
  "systemStatus": "nominal"
}
```

---

## Legacy

### `GET /rebalance`

Returns redistribution recommendations (kept for backward compat).

---

## Status codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Validation error |
| 404 | Not found |
| 422 | Unprocessable (e.g. insufficient batteries) |
| 500 | Internal error |

## Frontend integration

```bash
NEXT_PUBLIC_API_URL=http://3.213.111.199:8000
```

All endpoints support `GET, POST, PATCH, DELETE, OPTIONS` from any origin (CORS `*`).
Polling intervals suggested: overview/heatmap ~10s · alerts ~15s · transfers ~10s · forecast/* ~60s.
