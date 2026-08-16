# Sistem Carian PTW

PTW Search System is a mobile-first internal lookup and verification tool for HSE teams in Malaysia. It helps field personnel quickly verify an approved Permit to Work record and proceed with work using the signed physical permit as the official record.

## Live URL

Use the Render-hosted HTTPS URL for the production deployment once the app is connected to your GitHub repository and database.

## Features

- Search by PTW number or advanced filters
- View detailed permit card with validity banner
- Dashboard for open permits and hot work volumes
- Admin login for creating and editing PTW records
- Printable QR label view for field workers
- Mobile-first layout for direct field use
- Safety disclaimer required for compliance

## Tech stack

- Node.js + Express
- MySQL 8
- Vanilla HTML/CSS/JavaScript
- GitHub Actions for CI/CD
- Render for hosting
- Aiven for MySQL
- cron-job.org for keepalive pinging

## Local setup

1. Clone the repository.
2. Copy `.env.example` to `.env`.
3. Update the environment values.
4. Import the schema and seed files into MySQL:
   ```bash
   mysql -u root -p ptw_system < database/schema.sql
   mysql -u root -p ptw_system < database/seed.sql
   ```
5. Install dependencies:
   ```bash
   npm install
   ```
6. Start the app:
   ```bash
   npm start
   ```
7. Open http://localhost:3000

## Deployment guide

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full free-tier deployment walkthrough.

## API reference

See [docs/API.md](docs/API.md) for the public and protected endpoint documentation.

## Free-tier limits and implications

- Render free web service: 512 MB RAM, 0.1 CPU, 5 GB monthly bandwidth
- Aiven free MySQL: capped resources and possible idle shutdown or cleanup behavior
- cron-job.org free keepalive: useful to keep the app awake and reduce cold starts
- This app intentionally uses a small DB pool and lightweight responses to stay within free-tier constraints

## Repository and deployment notes

This repository is intended to remain private because it contains internal personnel and site data. Private GitHub visibility does not prevent the deployed app from being used by field workers through the public URL.

## Roadmap

- Audit log for admin actions
- PDF export and printable permit packs
- Expiry notifications
- Role-based access for multiple admin levels
- CSV import for bulk PTW entry
- Dependabot and code scanning integration

## Security and compliance

- Prepared statements for every database query
- CSRF protection enabled for writes
- Session-based admin login
- Helmet security headers
- Rate limiting on search endpoints
- No secrets committed to the repository
