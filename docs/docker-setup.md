# Docker Setup

This project supports production-ready Docker deployment.

## Build and Run

1. Copy environment file

```bash
cp .env.sample .env
```

2. Add Firebase configuration values to `.env`.

3. Run the application

```bash
docker compose up --build
```

The app will be available at:

```
http://localhost:80
```

## Docker Architecture

The Dockerfile uses a multi-stage build:

### 1. `deps` stage
Installs dependencies using `npm ci --legacy-peer-deps`. This layer is cached separately so rebuilds skip npm install when only source files change.

### 2. `builder` stage
Builds the frontend using Vite. All `VITE_APP_*` environment variables are passed as build-time ARGs and baked into the compiled JS bundle at this stage.

### 3. `runner` stage
Uses `nginx:1.25-alpine` to serve the compiled `dist/` files. No Node.js or source code is present in the final image.

This approach reduces final image size and improves layer caching.

## Environment Variables

All Firebase configuration is passed at **build time** via `--build-arg`. The running nginx container has no access to raw credentials — they are already compiled into the static JS bundle.

| Variable | Description |
|---|---|
| `VITE_APP_FIREBASE_API_KEY` | Firebase API key |
| `VITE_APP_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_APP_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_APP_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID |
| `VITE_APP_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_APP_FIREBASE_MEASUREMENTID` | Analytics measurement ID |
| `VITE_APP_DATABASE_URL` | Realtime Database URL |
| `VITE_APP_FIREBASE_STORAGE_BUCKET` | Cloud Storage bucket |
| `VITE_APP_FIREBASE_FCM_VAPID_KEY` | FCM VAPID key |

## Health Check

`docker-compose.yml` includes a healthcheck using `wget` to verify nginx is serving correctly:

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost/"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 10s
```

## Manual Build

To build and run without docker compose:

```bash
# Build
docker build $(cat .env | grep -v '^#' | grep VITE | sed 's/^/--build-arg /') -t codelabz:latest .

# Run
docker run -p 80:80 codelabz:latest
```
