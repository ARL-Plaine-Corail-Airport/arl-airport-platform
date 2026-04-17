# Load Testing

## Prerequisites

Set the `APP_URL` environment variable to the target:

```bash
# Local (Docker Compose)
export APP_URL=https://localhost

# Staging
export APP_URL=https://staging.airport.example.com
```

## Running

```bash
# Baseline test (~4800 users over 2.5 min)
pnpm test:load

# Stress test (~25000 users over 3.5 min)
pnpm test:load:stress
```

## Interpreting Results

Artillery prints a summary with:

- **http.response_time.p95/p99**: 95th and 99th percentile response times
- **http.codes.xxx**: count of each HTTP status code
- **vusers.completed**: virtual users that finished their scenario

### Thresholds (baseline)

- p99 < 2000ms
- p95 < 1000ms
- Error rate < 1%

If thresholds fail, Artillery exits with code 1.
