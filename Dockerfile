# ============================================================================
# The Shelf — Dockerfile
# Multi-stage build: Stage 1 builds the React frontend, Stage 2 runs Express
# ============================================================================

# --- Stage 1: Build the React frontend ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (Docker layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for Vite build)
RUN npm ci

# Copy source code
COPY . .

# Build the React frontend into /app/dist
RUN npm run build

# --- Stage 2: Production runtime ---
FROM node:20-alpine AS runtime

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend source and config files
COPY server.ts tsconfig.json vite.config.ts index.html ./

# Copy storage directories (empty structure for volumes)
RUN mkdir -p /app/storage/epub /app/storage/covers

# Expose port 3000
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Health check — hit the books API to verify the server is alive
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/books || exit 1

# Start the Express server (tsx runs TypeScript directly)
CMD ["npx", "tsx", "server.ts"]
