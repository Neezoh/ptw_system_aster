# API reference

The PTW app exposes both public lookup APIs and protected admin endpoints.

## Public endpoints

### GET /api/health
Returns server and database availability.

Example response:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "db": "connected",
    "latencyMs": 12,
    "appUrl": "https://your-app.onrender.com"
  },
  "error": null,
  "meta": { "status": 200 }
}
```

### GET /api/lookups
Returns locations and personnel lookup lists.

### GET /api/ptw
Returns paginated records with optional filters:

- q
- status
- location
- type
- from
- to
- workLeader
- authority
- page
- limit

### GET /api/ptw/:ptwNumber
Returns a single PTW record.

### GET /api/ptw/suggest?q=
Returns typeahead result matches, max 10 entries.

### GET /api/stats
Returns all dashboard statistics in one call.

## Admin endpoints

### POST /login
Logs in the HSE admin user.

### POST /logout
Logs out the current admin session.

### POST /api/ptw
Creates a PTW record.

### PUT /api/ptw/:id
Updates a PTW record.

## Response contract

All API responses follow the same shape:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": { "status": 200 }
}
```

## Validation rules

- PTW number must match `PTW-YYYY-XXXXX`
- JHA number must match `JHA-YYYY-XXXXX`
- Status must be one of `Open`, `Closed`, `Suspended`, `Extended`
- `date_closed` is required for `Closed` records
- Hot work permits require a non-empty remark

## Security notes

- All database queries use prepared statements.
- Public users read only; write routes are session protected.
- CSRF is enabled for mutating requests.
- Search and suggestion routes are rate limited.
