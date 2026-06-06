# 3rike Swap — API Contract (v1)

> **Audience:** Backend / Cloud engineer implementing the services behind the
> 3rike Swap operator dashboard.
> **Purpose:** Defines every HTTP endpoint the frontend needs, with request
> payloads and exact response shapes. Response shapes map 1:1 to the data the UI
> already renders (see [`src/lib/data.ts`](../src/lib/data.ts) for the current
> mock that these endpoints replace).
> **Status:** Draft v1 — frontend is built against these shapes. Flag anything
> impractical and we'll adjust the client.

---

## Table of contents
1. [Conventions](#1-conventions)
2. [Authentication](#2-authentication)
3. [Errors](#3-errors)
4. [Pagination, filtering & sorting](#4-pagination-filtering--sorting)
5. [Enums](#5-enums-reference)
6. [Dashboard](#6-dashboard)
7. [Station Network](#7-station-network)
8. [AI Forecasting](#8-ai-forecasting)
9. [Redistribution](#9-redistribution)
10. [Settings & Profile](#10-settings--profile)
11. [Realtime (live updates)](#11-realtime-live-updates)
12. [Appendix A — TypeScript types](#appendix-a--typescript-types)
13. [Appendix B — Frontend integration & env](#appendix-b--frontend-integration--env)
14. [Versioning & changelog](#versioning--changelog)

---

## 1. Conventions

| Topic | Rule |
|---|---|
| **Base URL** | `https://api.3rike.xyz/v1` (configurable per env). All paths below are relative to this. |
| **Versioning** | Path-based (`/v1`). Breaking changes ship under a new prefix. |
| **Content type** | `application/json; charset=utf-8` for requests and responses. |
| **Casing** | JSON keys: `camelCase`. Enum **values**: `lower_snake_case` machine values (`in_transit`, `low_stock`) — the UI maps these to display labels. |
| **Timestamps** | ISO-8601 UTC with `Z` suffix, e.g. `2026-06-06T14:32:00Z`. Never send pre-formatted relative strings ("2 min ago") — the UI computes those. |
| **Durations** | Integer **seconds** unless the field name says otherwise (e.g. `estEmptyMinutes`). |
| **Money** | Object `{ "value": <integer>, "currency": "NGN" }`. `value` is the whole-unit amount (not kobo). The UI formats display (`₦1.2M`). |
| **IDs** | Every resource returns a stable string `id`. Do **not** rely on `name` as a key. IDs are opaque (slug or UUID both fine). |
| **Coordinates** | Map/heatmap positions use normalized `x`/`y` floats in `[0,100]`. If real geodata exists, additionally send `lat`/`lng` (WGS-84) and we'll project client-side. |
| **Nullability** | Use explicit `null` for "no value" (e.g. offline station inventory). Do not omit the key. |
| **Empty lists** | Return `{ "items": [], ... }`, never `null`. |
| **Time zone** | All timestamps UTC; the operator's display TZ comes from `GET /settings` (`organization.timezone`). |
| **CORS** | Allow the dashboard origin(s); permit `Authorization`, `Content-Type` headers and `GET, POST, PATCH, DELETE, OPTIONS`. |
| **Compression** | `gzip`/`br` encouraged. |

---

## 2. Authentication

- Scheme: **Bearer token** in the `Authorization` header.
  ```http
  Authorization: Bearer <operator_access_token>
  ```
- All endpoints require auth **except** the auth/login flow itself (out of scope for this doc; assume the token is already issued).
- `401 Unauthorized` → missing/expired token. `403 Forbidden` → authenticated but not permitted (e.g. operator without redistribution rights).
- Tokens are scoped to a single **operator org**; all data is implicitly filtered to that org. No `orgId` needs to be passed.

---

## 3. Errors

All non-2xx responses use this envelope:

```json
{
  "error": {
    "code": "station_not_found",
    "message": "No station with id 'vi-hub-x'.",
    "details": null
  }
}
```

| HTTP | `code` examples | Meaning |
|---|---|---|
| `400` | `validation_error` | Malformed body / bad query param. `details` may carry field errors. |
| `401` | `unauthorized` | Missing or invalid token. |
| `403` | `forbidden` | Authenticated but not allowed. |
| `404` | `station_not_found`, `transfer_not_found` | Resource does not exist. |
| `409` | `conflict` | e.g. transfer already dispatched. |
| `422` | `unprocessable` | Valid shape, invalid business state (e.g. transfer batteries > source inventory). |
| `429` | `rate_limited` | Includes `Retry-After` header (seconds). |
| `500` | `internal_error` | Unexpected. |

`validation_error` `details` shape:
```json
{ "error": { "code": "validation_error", "message": "Invalid request",
  "details": [ { "field": "batteries", "message": "must be > 0" } ] } }
```

---

## 4. Pagination, filtering & sorting

List endpoints accept (all optional):

| Param | Type | Default | Notes |
|---|---|---|---|
| `limit` | int | `50` | Max `200`. |
| `cursor` | string | — | Opaque cursor from previous page's `nextCursor`. |
| `q` | string | — | Free-text search where supported (station name, etc.). |
| `sort` | string | endpoint-specific | e.g. `-swapsToday` (prefix `-` = desc). |

Paginated responses wrap items:
```json
{ "items": [ /* ... */ ], "nextCursor": "eyJ...", "total": 52 }
```
- `nextCursor` is `null` on the last page.
- `total` is the unfiltered-by-page count (best-effort; may be omitted if expensive).

Small/bounded lists in this doc (alerts, predictions, insights, routes) may return all items without a cursor; `nextCursor` simply stays `null`.

---

## 5. Enums reference

| Enum | Values | Used by |
|---|---|---|
| `StationStatus` | `online` · `warning` · `critical` · `offline` | stations, heatmap nodes, alerts, predictions |
| `HeatmapWindow` | `live` · `24h` · `7d` | `GET /dashboard/heatmap` |
| `StationFilter` | `all` · `online` · `offline` · `low_stock` · `critical` | `GET /stations` |
| `ForecastHorizon` | `6h` · `12h` · `24h` · `7d` | forecast endpoints |
| `PredictionKind` | `critical` · `time` · `surplus` | `GET /forecast/predictions` |
| `InsightType` | `pattern` · `optimization` · `risk` | `GET /forecast/insights` |
| `TransferStatus` | `pending` · `in_transit` · `completed` · `cancelled` | transfers |
| `NodeKind` | `source` · `destination` | redistribution routes |
| `AccentColor` *(display hint, optional)* | `green` · `info` · `purple` · `warning` · `critical` | stat tiles |

> **Status → meaning** (battery inventory): `online` healthy (≥60%), `warning`/`low_stock` (25–60%), `critical` (<25% or near-empty), `offline` (unreachable). Thresholds are configurable via `GET /settings`.

---

## 6. Dashboard

### 6.1 `GET /dashboard/overview`
Powers the 8 stat cards (top row + bottom row).

**Response `200`**
```json
{
  "totalBatteries":        { "value": 2847, "deltaWeek": 124 },
  "activeSwapsToday":      { "value": 1293, "deltaPctVsYesterday": 18 },
  "stationsOnline":        { "online": 48, "total": 52, "needAttention": 4 },
  "shortageAlerts":        { "total": 7, "critical": 3, "warning": 4 },
  "avgSwapTimeMin":        { "value": 2.4, "deltaPct": -12 },
  "fleetUtilizationPct":   { "value": 87, "deltaVsTarget": 5 },
  "predictionAccuracyPct": { "value": 94.2, "modelVersion": "3rike AI v3.2" },
  "revenueToday":          { "value": 1200000, "currency": "NGN", "deltaPctVsForecast": 23 }
}
```
**Field notes**
- `delta*` values are signed numbers; negative renders red/down, positive green/up. (`avgSwapTimeMin.deltaPct = -12` is shown as a *positive* "improved" — the UI knows lower swap time is good.)
- `needAttention` = stations not fully `online`.

---

### 6.2 `GET /dashboard/heatmap`
Powers the Demand Heatmap bubble plane.

**Query**
| Param | Type | Default | Notes |
|---|---|---|---|
| `window` | `HeatmapWindow` | `live` | Aggregation window for `demand`. |

**Response `200`**
```json
{
  "window": "live",
  "generatedAt": "2026-06-06T15:00:00Z",
  "nodes": [
    { "stationId": "vi-hub",  "name": "Victoria Island",   "x": 53, "y": 42, "lat": 6.4281, "lng": 3.4219, "demand": 80, "status": "critical" },
    { "stationId": "allen",   "name": "Allen Junction",    "x": 40, "y": 52, "demand": 70, "status": "online" },
    { "stationId": "ikeja",   "name": "Ikeja GRA",         "x": 60, "y": 57, "demand": 52, "status": "warning" }
  ]
}
```
- `demand`: integer `0–100`; drives bubble size and glow intensity.
- `x`/`y` required (normalized). `lat`/`lng` optional.

---

### 6.3 `GET /alerts`
Powers the **Live Alerts** panel and the dashboard "Shortage Alerts" count.

**Query**
| Param | Type | Default | Notes |
|---|---|---|---|
| `status` | `StationStatus` | — | Filter (`critical`, `warning`, …). |
| `limit` | int | `20` | |

**Response `200`**
```json
{
  "total": 7,
  "items": [
    { "id": "alt_01", "stationId": "vi-hub", "station": "Victoria Island",
      "status": "critical", "message": "Only 2 batteries left, demand surge expected",
      "createdAt": "2026-06-06T14:58:00Z" },
    { "id": "alt_02", "stationId": "lekki-1", "station": "Lekki Phase 1",
      "status": "critical", "message": "Station offline, 12 batteries stranded",
      "createdAt": "2026-06-06T14:52:00Z" }
  ]
}
```
- `total` = full unread/active count (drives the red "7" badge), independent of `limit`.
- UI renders relative time from `createdAt`.

---

## 7. Station Network

### 7.1 `GET /stations`
Powers the station grid **and** the Network Summary panel.

**Query**
| Param | Type | Default | Notes |
|---|---|---|---|
| `status` | `StationFilter` | `all` | `low_stock` ≈ `warning`. |
| `q` | string | — | Search by station name. |
| `limit` / `cursor` | — | — | Standard pagination. |

**Response `200`**
```json
{
  "summary": {
    "totalStations": 52,
    "online": 48,
    "totalInventory": 1847,
    "totalCapacity": 2080,
    "critical": 3,
    "warning": 4
  },
  "items": [
    { "id": "vi-hub", "name": "Victoria Island Hub", "status": "critical",
      "inventory": 2, "capacity": 40, "swapsToday": 127,
      "estEmptyMinutes": 18, "lastOnlineAt": null },

    { "id": "maryland", "name": "Maryland Mall", "status": "online",
      "inventory": 36, "capacity": 40, "swapsToday": 43,
      "estEmptyMinutes": 720, "lastOnlineAt": null },

    { "id": "opebi", "name": "Opebi Link Road", "status": "offline",
      "inventory": null, "capacity": 30, "swapsToday": null,
      "estEmptyMinutes": null, "lastOnlineAt": "2026-06-06T13:00:00Z" }
  ],
  "nextCursor": null,
  "total": 52
}
```
**Field notes**
- `inventory`, `swapsToday`, `estEmptyMinutes` are `null` when `status = "offline"`.
- `lastOnlineAt` is non-null **only** when `offline`.
- `estEmptyMinutes` → UI formats: `< 60` → `"18m"`, else `"2.1h"`.
- Inventory bar % = `inventory / capacity * 100`; color by threshold (green ≥60, amber ≥25, red <25).
- `summary` reflects the **whole network** (not the filtered page).

---

### 7.2 `GET /stations/{id}`
Single station detail (same object as a list item; may include extras below).

**Response `200`**
```json
{
  "id": "vi-hub", "name": "Victoria Island Hub", "status": "critical",
  "inventory": 2, "capacity": 40, "swapsToday": 127,
  "estEmptyMinutes": 18, "lastOnlineAt": null,
  "lat": 6.4281, "lng": 3.4219,
  "address": "Victoria Island, Lagos",
  "updatedAt": "2026-06-06T15:00:00Z"
}
```
`404` → `station_not_found`.

---

### 7.3 `POST /stations`  *(powers "Add Station")*
**Request**
```json
{
  "name": "Yaba Tech Campus",
  "capacity": 35,
  "lat": 6.5174,
  "lng": 3.3776,
  "address": "Yaba, Lagos"
}
```
| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | ✓ | |
| `capacity` | int | ✓ | Slot count, > 0. |
| `lat` / `lng` | float | ✗ | |
| `address` | string | ✗ | |

**Response `201`** → the created station object (as in 7.2). New stations start `offline` until first heartbeat.

---

## 8. AI Forecasting

### 8.1 `GET /forecast/stats`
Powers the 4 forecasting stat cards.

**Response `200`**
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
- `nextUpdateInSeconds` → UI shows countdown `4:32`.

---

### 8.2 `GET /forecast/series`
Powers the **Demand Forecast — Network** chart (predicted vs actual line + risk band + "Now" marker).

**Query**
| Param | Type | Default | Notes |
|---|---|---|---|
| `horizon` | `ForecastHorizon` | `24h` | Total span. |
| `interval` | string | `1h` | Bucket size (`1h`, `30m`, …). |

**Response `200`**
```json
{
  "unitMax": 800,
  "nowAt": "2026-06-06T15:00:00Z",
  "points": [
    { "t": "2026-06-06T06:00:00Z", "predicted": 180, "actual": 165 },
    { "t": "2026-06-06T09:00:00Z", "predicted": 520, "actual": 540 },
    { "t": "2026-06-06T15:00:00Z", "predicted": 460, "actual": 455 },
    { "t": "2026-06-06T18:00:00Z", "predicted": 740, "actual": null },
    { "t": "2026-06-06T21:00:00Z", "predicted": 420, "actual": null }
  ],
  "riskWindows": [
    { "startAt": "2026-06-06T18:00:00Z", "endAt": "2026-06-06T21:00:00Z", "severity": "critical" }
  ]
}
```
**Field notes**
- `points` ordered by `t` ascending; one entry per `interval`.
- `actual` is a number for buckets at/before `nowAt`, `null` afterwards (future). `predicted` is always present.
- `unitMax` = chart y-axis ceiling (swaps/interval).
- `riskWindows` render the red "RISK" band; `severity` ∈ `warning|critical`.

---

### 8.3 `GET /forecast/predictions`
Powers the **AI Predictions** list (right rail).

**Query**
| Param | Type | Default |
|---|---|---|
| `horizon` | `ForecastHorizon` | `6h` |

**Response `200`**
```json
{
  "horizon": "6h",
  "items": [
    { "stationId": "vi-hub", "station": "Victoria Island", "status": "critical",
      "kind": "critical", "etaAt": null, "label": "Critical",
      "note": "Empty in 18 min at current rate",
      "recommendation": { "action": "Emergency dispatch", "units": null } },

    { "stationId": "lekki-1", "station": "Lekki Phase 1", "status": "warning",
      "kind": "time", "etaAt": "2026-06-06T18:30:00Z", "label": "6:30 PM",
      "note": "Rush hour surge expected",
      "recommendation": { "action": "Pre-position", "units": 15 } },

    { "stationId": "allen", "station": "Allen Junction", "status": "online",
      "kind": "surplus", "etaAt": null, "label": "Surplus",
      "note": "Low demand expected tonight",
      "recommendation": { "action": "Redistribute", "units": 8 } }
  ]
}
```
**Field notes**
- `kind` drives the tag icon/color: `critical` (alert/red), `time` (clock/amber, uses `etaAt`), `surplus` (uptrend/green).
- `label` is a short display chip — for `time` it's the local-formatted `etaAt`; the UI can also derive it from `etaAt` if you prefer to omit `label`.
- `recommendation.units` may be `null` (e.g. emergency dispatch).

---

### 8.4 `GET /forecast/insights`
Powers the 3 insight cards (Pattern / Optimization / Risk).

**Response `200`**
```json
{
  "items": [
    { "id": "ins_01", "type": "pattern", "title": "Pattern Detected",
      "body": "Friday evening demand typically 34% higher than weekdays. Consider pre-positioning batteries by 4 PM." },
    { "id": "ins_02", "type": "optimization", "title": "Optimization Opportunity",
      "body": "3 stations have consistent surplus. Reallocating 25 batteries could improve network efficiency by 12%." },
    { "id": "ins_03", "type": "risk", "title": "Risk Alert",
      "body": "Weather forecast: Rain expected 6-9 PM. Historical data shows 28% demand drop during rain." }
  ]
}
```

---

## 9. Redistribution

### 9.1 `GET /redistribution/stats`
Powers the 4 redistribution stat cards.

**Response `200`**
```json
{
  "pendingTransfers": 12,
  "inTransit":      { "count": 5, "batteriesEnRoute": 143 },
  "completedToday": { "count": 8, "batteriesMoved": 247 },
  "fleet":          { "active": 6, "total": 8 }
}
```

---

### 9.2 `GET /redistribution/routes`
Powers the **Active Routes** map (nodes, dashed routes, vehicle markers).

**Response `200`**
```json
{
  "generatedAt": "2026-06-06T15:00:00Z",
  "nodes": [
    { "id": "allen",    "label": "Allen",        "kind": "source",      "x": 18, "y": 35, "lat": 6.61, "lng": 3.35 },
    { "id": "maryland", "label": "Maryland",     "kind": "source",      "x": 80, "y": 26 },
    { "id": "vi",       "label": "Victoria Is.", "kind": "destination", "x": 57, "y": 66 },
    { "id": "yaba",     "label": "Yaba",         "kind": "destination", "x": 22, "y": 74 }
  ],
  "routes": [
    { "id": "rt_01", "fromId": "allen",    "toId": "vi",   "vehicleId": "VH-01" },
    { "id": "rt_03", "fromId": "maryland", "toId": "yaba", "vehicleId": "VH-03" }
  ],
  "vehicles": [
    { "id": "VH-01", "label": "VH-01", "x": 39, "y": 52, "units": 25, "transferId": "trf_01" },
    { "id": "VH-03", "label": "VH-03", "x": 65, "y": 50, "units": 18, "transferId": "trf_03" }
  ]
}
```
- `nodes[].kind`: `source` (green) or `destination` (red).
- `vehicles[].units` = batteries carried; `x`/`y` = current position along the route.
- `routes[].fromId`/`toId` reference `nodes[].id`.

---

### 9.3 `GET /transfers`
Powers the **Active Transfers** list.

**Query**
| Param | Type | Default | Notes |
|---|---|---|---|
| `status` | `TransferStatus` | — | Filter. Omit for all active (`pending` + `in_transit`). |
| `limit` / `cursor` | — | — | Standard pagination. |

**Response `200`**
```json
{
  "items": [
    { "id": "trf_01", "vehicleId": "VH-01",
      "fromStationId": "allen", "toStationId": "vi", "routeLabel": "Allen → Victoria Is.",
      "status": "in_transit", "batteries": 25,
      "etaAt": "2026-06-06T15:12:00Z", "departsAt": "2026-06-06T14:47:00Z",
      "progressPct": 72 },

    { "id": "trf_04", "vehicleId": "VH-02",
      "fromStationId": "ikeja", "toStationId": "lekki-1", "routeLabel": "Ikeja → Lekki Ph1",
      "status": "pending", "batteries": 30,
      "etaAt": null, "departsAt": "2026-06-06T16:30:00Z",
      "progressPct": 0 }
  ],
  "nextCursor": null
}
```
**Field notes**
- `routeLabel` is a convenience display string; the UI can also build it from station names.
- `in_transit` → uses `etaAt` + `progressPct` (0–100). `pending` → uses `departsAt`, `progressPct = 0`.

---

### 9.4 `POST /transfers`  *(powers "Schedule Redistribution")*
**Request**
```json
{
  "fromStationId": "allen",
  "toStationId": "vi",
  "batteries": 25,
  "scheduledAt": "2026-06-06T16:00:00Z",
  "vehicleId": "VH-01"
}
```
| Field | Type | Required | Notes |
|---|---|---|---|
| `fromStationId` | string | ✓ | Must have surplus ≥ `batteries`. |
| `toStationId` | string | ✓ | |
| `batteries` | int | ✓ | > 0. |
| `scheduledAt` | ISO ts | ✗ | Omit = dispatch now. |
| `vehicleId` | string | ✗ | Omit = auto-assign. |

**Response `201`** → created transfer object (as in 9.3).
`422 unprocessable` if `batteries` exceeds source inventory.

---

### 9.5 `POST /redistribution/optimize`  *(powers "Optimize Routes")*
Runs the AI optimizer and returns **proposed** transfers (not yet committed).

**Request**
```json
{ "horizon": "6h", "autoApply": false }
```
| Field | Type | Default | Notes |
|---|---|---|---|
| `horizon` | `ForecastHorizon` | `6h` | Planning window. |
| `autoApply` | bool | `false` | `true` = create the transfers immediately. |

**Response `200`**
```json
{
  "proposed": [
    { "fromStationId": "allen", "toStationId": "vi", "batteries": 25,
      "reason": "Victoria Is. forecast empty in 18m", "estImprovementPct": 12 }
  ],
  "applied": false
}
```
If `autoApply = true`, `applied = true` and each item also includes a created `transferId`.

---

## 10. Settings & Profile

### 10.1 `GET /settings`
Powers the Settings page.

**Response `200`**
```json
{
  "organization": { "name": "3rike Lagos", "region": "Lagos", "currency": "NGN", "timezone": "Africa/Lagos" },
  "thresholds":   { "criticalBelowPct": 15, "warningBelowPct": 30, "autoGenerateAlerts": true, "predictiveWarnings": true },
  "ai":           { "forecastHorizon": "24h", "autoRedistributeSurplus": true, "weatherAdjusted": true },
  "notifications":{ "criticalAlerts": true, "dailyDigest": true, "smsFieldTeam": false, "weeklyReport": false }
}
```

### 10.2 `PATCH /settings`  *(powers "Save changes")*
Accepts any **partial** subset; deep-merges into the existing config.

**Request (example)**
```json
{ "thresholds": { "criticalBelowPct": 12 }, "notifications": { "smsFieldTeam": true } }
```
**Response `200`** → the full updated settings object (as in 10.1).
`400 validation_error` if a percentage is out of `0–100` or an enum is invalid.

---

### 10.3 `GET /me`
Powers the sidebar operator card.

**Response `200`**
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
`systemStatus` ∈ `nominal | degraded | down` (drives the footer status dot).

---

## 11. Realtime (live updates)

The Dashboard heatmap, Live Alerts, and Active Transfers are "Live". Provide **one** of:

### Option A — Server-Sent Events / WebSocket (preferred)
`GET /stream` (SSE) or `wss://api.3rike.xyz/v1/stream`. Authenticated like REST.

Event envelope:
```json
{ "type": "alert.created", "at": "2026-06-06T15:00:05Z", "data": { /* payload */ } }
```

| `type` | `data` payload | UI effect |
|---|---|---|
| `alert.created` | an Alert object (see 6.3) | Prepend to Live Alerts; bump badge. |
| `alert.resolved` | `{ "id": "alt_01" }` | Remove from list; decrement badge. |
| `station.updated` | a Station object (see 7.1) | Patch station card + heatmap node. |
| `heatmap.tick` | `{ "nodes": [ /* HeatNode[] */ ] }` | Refresh bubble sizes/status. |
| `transfer.updated` | a Transfer object (see 9.3) | Patch transfer row + vehicle position. |
| `overview.updated` | partial overview (see 6.1) | Patch stat cards. |

### Option B — Polling fallback
All GETs above are safe to poll. Suggested intervals:
`overview` & `heatmap` ~10s · `alerts` ~15s · `transfers` & `routes` ~10s · `forecast/*` ~60s.

---

## Appendix A — TypeScript types

The frontend will consume these (mirrors current [`src/lib/data.ts`](../src/lib/data.ts)).

```ts
type StationStatus = "online" | "warning" | "critical" | "offline";
type TransferStatus = "pending" | "in_transit" | "completed" | "cancelled";
type PredictionKind = "critical" | "time" | "surplus";
type InsightType = "pattern" | "optimization" | "risk";
type Money = { value: number; currency: string };

interface DashboardOverview {
  totalBatteries: { value: number; deltaWeek: number };
  activeSwapsToday: { value: number; deltaPctVsYesterday: number };
  stationsOnline: { online: number; total: number; needAttention: number };
  shortageAlerts: { total: number; critical: number; warning: number };
  avgSwapTimeMin: { value: number; deltaPct: number };
  fleetUtilizationPct: { value: number; deltaVsTarget: number };
  predictionAccuracyPct: { value: number; modelVersion: string };
  revenueToday: Money & { deltaPctVsForecast: number };
}

interface HeatNode {
  stationId: string; name: string;
  x: number; y: number; lat?: number; lng?: number;
  demand: number; status: StationStatus;
}

interface Alert {
  id: string; stationId: string; station: string;
  status: StationStatus; message: string; createdAt: string;
}

interface Station {
  id: string; name: string; status: StationStatus;
  inventory: number | null; capacity: number; swapsToday: number | null;
  estEmptyMinutes: number | null; lastOnlineAt: string | null;
  lat?: number; lng?: number; address?: string; updatedAt?: string;
}

interface NetworkSummary {
  totalStations: number; online: number;
  totalInventory: number; totalCapacity: number;
  critical: number; warning: number;
}

interface ForecastStats {
  modelAccuracyPct: number; modelVersion: string;
  predictionsToday: number; predictionsCorrectPct: number;
  shortagesPreventedThisWeek: number; nextUpdateInSeconds: number;
}

interface ForecastSeries {
  unitMax: number; nowAt: string;
  points: { t: string; predicted: number; actual: number | null }[];
  riskWindows: { startAt: string; endAt: string; severity: "warning" | "critical" }[];
}

interface Prediction {
  stationId: string; station: string; status: StationStatus;
  kind: PredictionKind; etaAt: string | null; label: string; note: string;
  recommendation: { action: string; units: number | null };
}

interface Insight { id: string; type: InsightType; title: string; body: string; }

interface RedistributionStats {
  pendingTransfers: number;
  inTransit: { count: number; batteriesEnRoute: number };
  completedToday: { count: number; batteriesMoved: number };
  fleet: { active: number; total: number };
}

interface MapNode { id: string; label: string; kind: "source" | "destination"; x: number; y: number; lat?: number; lng?: number; }
interface RouteLine { id: string; fromId: string; toId: string; vehicleId: string; }
interface Vehicle { id: string; label: string; x: number; y: number; units: number; transferId: string; }

interface Transfer {
  id: string; vehicleId: string;
  fromStationId: string; toStationId: string; routeLabel: string;
  status: TransferStatus; batteries: number;
  etaAt: string | null; departsAt: string | null; progressPct: number;
}

interface Settings {
  organization: { name: string; region: string; currency: string; timezone: string };
  thresholds: { criticalBelowPct: number; warningBelowPct: number; autoGenerateAlerts: boolean; predictiveWarnings: boolean };
  ai: { forecastHorizon: "6h" | "12h" | "24h" | "7d"; autoRedistributeSurplus: boolean; weatherAdjusted: boolean };
  notifications: { criticalAlerts: boolean; dailyDigest: boolean; smsFieldTeam: boolean; weeklyReport: boolean };
}
```

---

## Appendix B — Frontend integration & env

- The frontend currently renders from the static mock in [`src/lib/data.ts`](../src/lib/data.ts). Each section above maps to one mock export; swapping to live data means replacing those reads with `fetch` calls.
- Planned client config (env):
  ```bash
  NEXT_PUBLIC_API_BASE_URL="https://api.3rike.xyz/v1"
  # token handling TBD (cookie session vs. bearer)
  ```
- Suggested endpoint → screen map:
  | Screen | Endpoints |
  |---|---|
  | Dashboard (`/`) | `GET /dashboard/overview`, `GET /dashboard/heatmap`, `GET /alerts` |
  | Station Network (`/stations`) | `GET /stations`, `POST /stations` |
  | AI Forecasting (`/forecasting`) | `GET /forecast/stats`, `GET /forecast/series`, `GET /forecast/predictions`, `GET /forecast/insights` |
  | Redistribution (`/redistribution`) | `GET /redistribution/stats`, `GET /redistribution/routes`, `GET /transfers`, `POST /transfers`, `POST /redistribution/optimize` |
  | Settings (`/settings`) | `GET /settings`, `PATCH /settings` |
  | Shell (sidebar) | `GET /me` |

---

## Versioning & changelog

| Version | Date | Notes |
|---|---|---|
| v1 (draft) | 2026-06-06 | Initial contract derived from the frontend data model. |

> Questions / proposed changes: leave them inline as comments or ping the frontend owner. Anything that can't be served as specified — say so early and we'll adapt the client rather than block.
