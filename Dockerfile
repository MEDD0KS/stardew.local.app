# --- Stage 1: install deps & build ---
FROM oven/bun:latest AS builder
WORKDIR /app

# Copy workspace root manifests
COPY package.json bun.lockb turbo.json ./

# Copy app manifest
COPY apps/stardew.app/package.json apps/stardew.app/

# Install dependencies
RUN bun install

# Copy source code
COPY apps/stardew.app/ apps/stardew.app/

# Build standalone Next.js
RUN cd apps/stardew.app && bun run build

# --- Stage 2: production image ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy standalone output
COPY --from=builder /app/apps/stardew.app/.next/standalone ./
COPY --from=builder /app/apps/stardew.app/.next/static ./apps/stardew.app/.next/static
COPY --from=builder /app/apps/stardew.app/public ./apps/stardew.app/public

EXPOSE 3000

CMD ["node", "apps/stardew.app/server.js"]
