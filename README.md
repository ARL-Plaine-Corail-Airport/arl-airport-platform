# ARL Airport Platform

Production-oriented scaffold for an official Rodrigues Airport / Plaine Corail Airport passenger information platform.

## Stack

- Next.js public web application
- Payload CMS embedded in the same codebase
- PostgreSQL
- Object storage ready media collection for PDFs and images
- PWA manifest + service worker + offline fallback
- Official-feed adapters for flights and weather

## What is included

- Public pages for:
  - Home
  - Arrivals
  - Departures
  - Flight Status
  - Notices / Communiqués
  - Passenger Guide
  - Transport & Parking
  - Accessibility
  - Airport Map
  - FAQ
  - Contact / Help Desk
  - Generic institutional content pages through the `pages` collection
- Payload collections / globals for governed content
- Role-based admin collection
- Approval-ready content model with draft / published status
- Operational integration placeholders for flight and weather providers
- Revalidation endpoint for CMS publish hooks
- Seed script with production-style starter content
- Security-conscious defaults and deployment notes

## Local setup

1. Copy environment values.

```bash
cp .env.example .env
```

2. Start PostgreSQL.

```bash
docker compose up -d
```

3. Install dependencies.

```bash
pnpm install
```

4. Generate Payload types after the first install.

```bash
pnpm generate:types
```

5. Seed starter content.

```bash
pnpm seed
```

6. Run the platform.

```bash
pnpm dev
```

Public site:
- `http://localhost:3000`

Payload admin:
- `http://localhost:3000/admin`

## Production notes

### Flight data
This scaffold intentionally does **not** fake live flight data. The UI is ready, but the adapter currently returns a safe unconfigured state until you connect:
- an official airport FIDS / AODB feed
- an airline operational feed
- or an approved manual override path

### Weather data
The weather adapter now uses Open-Meteo by default for live passenger-facing conditions with Plaine Corail Airport coordinates. For operational aviation weather, continue to rely on official METAR and TAF sources such as the Mauritius Meteorological Services.

### Publish workflow
Recommended editorial flow:
- editor drafts content
- approver reviews
- approver publishes
- revalidation webhook purges stale public pages

### Admin hardening
Before going live:
- enforce MFA for all admin users
- place the app behind a CDN / WAF
- connect S3 / R2 storage for media
- add centralized logging and uptime monitoring
- run an accessibility audit and legal review
- configure automated database backups and restore drills

## Suggested CMS slugs for institutional pages

Create pages in Payload using these slugs:
- `about-us`
- `airlines`
- `airport-amenities`
- `airport-news-events`
- `airport-location-information`
- `airport-vip-lounge`
- `airport-regulations`
- `airport-usage-fees-information`
- `emergency-services`
- `management-staffs`
- `parking-facility`
- `useful-links`
- `weather-condition`
- `working-hours-direction`
- `privacy`
- `terms`
- `disclaimer`

## Deployment target

Recommended real deployment:
- Cloudflare in front of the origin
- Node host for Next.js + Payload
- managed Postgres
- object storage for PDFs / media
- scheduled worker for feed synchronization
