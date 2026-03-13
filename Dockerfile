# ══════════════════════════════════════════════════════════════════════════════
# Codelabz — Production Dockerfile
# Multi-stage build: deps → builder → runner
#
# Final image: nginx:alpine serving static files (~25 MB)
# No Node.js, no source code, no dev tools in production.
#
# Build-time env vars (VITE_APP_*) are baked into the JS bundle by Vite.
# They are NOT available at runtime — pass them with --build-arg.
#
# Quick build:
#   docker build $(cat .env | grep -v '^#' | grep VITE | sed 's/^/--build-arg /') -t codelabz:latest .
# Quick run:
#   docker run -p 80:80 codelabz:latest
# ══════════════════════════════════════════════════════════════════════════════


# ── Stage 1: install dependencies ─────────────────────────────────────────────
# Separated from the build stage so Docker layer cache skips npm install
# on rebuilds where only source files changed (package-lock.json unchanged).
FROM node:18-alpine AS deps

WORKDIR /app

# Copy manifests only — this layer is invalidated only when lockfile changes
COPY package.json package-lock.json ./

# --legacy-peer-deps is required: the project has unresolved peer dependency
# conflicts. Every CI workflow uses this flag; omitting it breaks the install.
RUN npm ci --legacy-peer-deps --prefer-offline


# ── Stage 2: build the React application ──────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Pull installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source (respects .dockerignore — .env, node_modules, cypress/,
# testdata/, functions/ are excluded)
COPY . .

# ── Vite build-time environment variables ─────────────────────────────────────
# Vite statically replaces VITE_APP_* in the compiled bundle at build time.
# These values do NOT exist in the final nginx image — they are baked into JS.
# Pass values via --build-arg or docker-compose build.args.
ARG VITE_APP_FIREBASE_API_KEY
ARG VITE_APP_AUTH_DOMAIN
ARG VITE_APP_FIREBASE_PROJECT_ID
ARG VITE_APP_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_APP_FIREBASE_APP_ID
ARG VITE_APP_FIREBASE_MEASUREMENTID
ARG VITE_APP_DATABASE_URL
ARG VITE_APP_FIREBASE_STORAGE_BUCKET
ARG VITE_APP_FIREBASE_FCM_VAPID_KEY
ARG VITE_APP_USE_EMULATOR=false

ENV VITE_APP_FIREBASE_API_KEY=$VITE_APP_FIREBASE_API_KEY
ENV VITE_APP_AUTH_DOMAIN=$VITE_APP_AUTH_DOMAIN
ENV VITE_APP_FIREBASE_PROJECT_ID=$VITE_APP_FIREBASE_PROJECT_ID
ENV VITE_APP_FIREBASE_MESSAGING_SENDER_ID=$VITE_APP_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_APP_FIREBASE_APP_ID=$VITE_APP_FIREBASE_APP_ID
ENV VITE_APP_FIREBASE_MEASUREMENTID=$VITE_APP_FIREBASE_MEASUREMENTID
ENV VITE_APP_DATABASE_URL=$VITE_APP_DATABASE_URL
ENV VITE_APP_FIREBASE_STORAGE_BUCKET=$VITE_APP_FIREBASE_STORAGE_BUCKET
ENV VITE_APP_FIREBASE_FCM_VAPID_KEY=$VITE_APP_FIREBASE_FCM_VAPID_KEY
ENV VITE_APP_USE_EMULATOR=$VITE_APP_USE_EMULATOR

# Build — outputs compiled SPA to /app/dist
RUN npm run build


# ── Stage 3: production image ─────────────────────────────────────────────────
# Only compiled static assets + nginx make it into this image.
# Node.js, all npm packages, and source code are discarded here.
FROM nginx:1.25-alpine AS runner

# Remove the default nginx placeholder site
RUN rm /etc/nginx/conf.d/default.conf

# Install our SPA-aware config (gzip, caching, try_files SPA fallback,
# security headers, hidden-file deny)
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy the Vite build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Validate config at build time — a syntax error fails the build, not prod
RUN nginx -t

EXPOSE 80

# nginx must run in foreground; daemon mode would make PID 1 exit immediately
CMD ["nginx", "-g", "daemon off;"]
