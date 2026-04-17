# ARL Airport Platform

Progressive Web App for **Sir Gaetan Duval Airport (RRG)**, Rodrigues Island, Mauritius.

Built with Next.js 15, Payload CMS 3, Supabase (Postgres + Storage), and Docker.

## Features

- Real-time flight board (arrivals & departures) via AirLabs API + manual CMS entries
- Live weather data from Open-Meteo (Plaine Corail Airport coordinates)
- Multilingual support (English / French)
- PWA with offline support and push-ready service worker
- Admin dashboard with role-based access control
- Nginx load balancer with horizontal scaling (multiple app replicas)
- Health check endpoint at `/api/health` (deep check with `?deep=true`)
- Approval-ready content model with draft / published status
- Revalidation endpoint for CMS publish hooks

## Public Pages

- Home, Arrivals, Departures, Flight Status
- Notices / Communiques, News & Events
- Passenger Guide, Transport & Parking, Airport Map
- VIP Lounge, Amenities, Accessibility
- FAQ, Contact / Help Desk
- Emergency Services, Useful Links
- Generic institutional content pages via the `pages` collection

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) >= 20.9.0 and [pnpm](https://pnpm.io/) (for seeding and local tasks)
- A [Supabase](https://supabase.com/) project (Postgres database + S3 storage)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ITintern901/arl-airport-platform.git
cd arl-airport-platform
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooled connection string (port 6543) |
| `PAYLOAD_SECRET` | Random secret, min 32 chars (`openssl rand -base64 48`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_S3_*` | S3-compatible storage credentials from Supabase |
| `FLIGHT_PROVIDER_API_KEY` | AirLabs API key (optional, for live flight data) |
| `REVALIDATE_SECRET` | Secret for on-demand ISR revalidation |

See [.env.example](.env.example) for the full list.

### 3. Set up SSL certificates (for local Nginx)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/selfsigned.key \
  -out nginx/ssl/selfsigned.crt \
  -subj "/CN=localhost"
```

### 4. Build and run

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

This starts:
- **Nginx** reverse proxy on ports 80/443
- **4 app replicas** (Next.js + Payload CMS)
- **Redis** for rate limiting and API caching

### 5. Seed the database (first run only)

```bash
pnpm install
pnpm seed
```

### 6. Access the platform

- Public site: `https://localhost`
- Admin dashboard: `https://localhost/admin`

## Architecture

```
                    Nginx (port 80/443)
                         |
            +-----------+-----------+
            |           |           |
         App :3000   App :3000   App :3000  ...  (replicas)
            |           |           |
            +-----+-----+-----+----+
                  |           |
           Supabase DB    Supabase Storage
           (Postgres)     (S3-compatible)
```

## Useful Commands

```bash
# Rebuild and restart
docker compose -f docker-compose.prod.yml up --build -d

# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Stop everything
docker compose -f docker-compose.prod.yml down

# Run database seed
pnpm seed

# Run linter
pnpm lint

# Run tests
pnpm test
```

## Health Checks

- **Liveness**: `GET /api/health` — returns `200` if the app is running
- **Deep check**: `GET /api/health?deep=true` — also verifies database connectivity

Docker automatically restarts unhealthy containers using the liveness endpoint.

## Branch Protection

The `main` branch is protected:
- Direct pushes are blocked
- Pull requests require 1 approving review
- Stale reviews are dismissed on new pushes
- Force pushes and branch deletion are blocked

## Production Notes

### Flight data
The flight board uses AirLabs API (free tier: 1,000 requests/month). Cache TTL is set to ~43 minutes across all layers to stay within budget. Airlines filtered: MK (Air Mauritius), UU (Air Austral). Manual flight entries can be added via the CMS admin.

### Weather data
Uses Open-Meteo with Plaine Corail Airport coordinates. For operational aviation weather, rely on official METAR/TAF sources from the Mauritius Meteorological Services.

### Publish workflow
1. Editor drafts content
2. Approver reviews
3. Approver publishes
4. Revalidation webhook purges stale public pages

### CMS page slugs

Create pages in Payload using these slugs: `about-us`, `airlines`, `airport-amenities`, `airport-news-events`, `airport-location-information`, `airport-vip-lounge`, `airport-regulations`, `airport-usage-fees-information`, `emergency-services`, `management-staffs`, `parking-facility`, `useful-links`, `weather-condition`, `working-hours-direction`, `privacy`, `terms`, `disclaimer`.

## License

Private — All rights reserved.
