# HTTP API quick reference

OptiForge exposes published models through tenant-scoped API keys. Keep API keys
on the server; never embed them in browser or mobile application bundles.

## Authentication

Send the key in every request:

```http
x-api-key: YOUR_API_KEY
```

Keys can be scoped separately for solving models, reading jobs, and reading
execution audits. A rejected or expired key returns `401`; an exhausted quota
returns `429`.

## Synchronous solve

```http
POST /api/v1/models/{modelKey}/solve
content-type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "resources": [],
    "tasks": [],
    "pairCosts": [],
    "forbiddenPairs": []
  },
  "solveOptions": {
    "timeLimitSeconds": 5,
    "randomSeed": 0,
    "workers": 1
  }
}
```

A successful response includes the solver result, the selected immutable model
version, and an execution audit identifier.

## Asynchronous solve

Queue longer work with:

```http
POST /api/v1/models/{modelKey}/solve-jobs
```

The server returns `202 Accepted`, a `Location` header, and a status URL. Poll:

```http
GET /api/v1/solve-jobs/{jobId}
```

The JavaScript client wraps this flow with `enqueue()` and `waitForJob()`.

## Stable canary routing

Send a stable business identifier when repeat requests should be routed to the
same published model version during a canary rollout:

```http
x-optiforge-routing-key: customer-42
```

Do not put secrets or personal data in this routing key.

## Error shape

```json
{
  "code": "INVALID_SOLVE_INPUT",
  "message": "The request could not be processed.",
  "issues": []
}
```

Treat `401` and `422` as non-retryable until the request is corrected. Back off
on `429` and transient `5xx` responses.
