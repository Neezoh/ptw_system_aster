# Deployment guide

This project is designed for a zero-cost or near-zero-cost setup with a free web host and a free MySQL-compatible database.

## Verified free-tier recommendations (checked 2026-08-17)

### App host: Render
- Web service free tier: $0/month
- Included: 512 MB RAM, 0.1 CPU, 5 GB monthly bandwidth
- Best for: Node.js web app deployed from GitHub
- Limitation: Render does not provide a free MySQL database. Use a separate free database service for the app's database layer.

### Database: Aiven
- MySQL free tier: $0/month for the free service
- Good for: small internal lookup tools and prototypes
- Limitation: free services may be stopped or restricted if idle or if the platform decides the service is inactive; keep the app alive with an external cron ping.

### Keep-alive: cron-job.org
- Free service for scheduled HTTP requests
- Use it to hit /api/health every 10 minutes
- This is the primary way to reduce cold starts on a free host

## Production setup

1. Create a private GitHub repository.
2. Push this project to the repository.
3. Provision a MySQL database on Aiven.
4. Import the schema and seed files from the database folder.
5. Create a new Render Web Service connected to the repository.
6. Add the environment variables from .env.example.
7. Deploy the service.
8. Set up a cron-job.org job calling the health endpoint every 10 minutes.

## Required environment variables

```env
PORT=3000
NODE_ENV=production
APP_URL=https://your-app.onrender.com
SESSION_SECRET=change-me
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=ptw_system
DB_USER=ptw_app
DB_PASSWORD=change-me
DB_SSL=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
```

## Render deployment notes

- Set the build command: `npm install`
- Set the start command: `npm start`
- Add a health check path on Render if available: `/api/health`
- Use a custom domain only if necessary; the default Render URL is enough for the internal tool

## Aiven database notes

- Create a MySQL 8 instance
- Use SSL enabled
- Import `database/schema.sql` and `database/seed.sql`
- Use a dedicated DB user with minimum privileges only for the app

## Cold-start mitigation

Free-tier services can sleep or wake slowly. Add a cron job that calls:

```text
https://your-app.onrender.com/api/health
```

every 10 minutes. This keeps the app warm and reduces first-load delays for field workers.

## Verification checklist

After deployment, confirm:

- `GET /api/health` returns 200
- `/` loads the public search page
- `/dashboard` loads the summary widgets
- `/admin` requires a login
- `/ptw/PTW-2025-00001` loads a populated permit
- no page crashes when MySQL is temporarily unreachable

## Recommended final production URL

Use the Render-hosted HTTPS URL as the official worker landing page. Keep the admin URL at `/admin` and the dashboard at `/dashboard`.
