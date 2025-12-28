# syntax=docker/dockerfile:1

# Builder: build Vite + TS app
FROM oven/bun:alpine AS builder

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 lyrprep && \
    adduser -D -u 1001 -G lyrprep lyrprep

COPY --chown=lyrprep:lyrprep package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY --chown=lyrprep:lyrprep . .
RUN chown -R lyrprep:lyrprep /app

USER lyrprep
RUN bun run build

# Runtime: run preview server
FROM oven/bun:alpine AS runtime

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 lyrprep && \
    adduser -D -u 1001 -G lyrprep lyrprep

# Copy built files and package.json from builder
COPY --from=builder --chown=lyrprep:lyrprep /app/dist ./dist
COPY --from=builder --chown=lyrprep:lyrprep /app/package.json ./

# Install dependencies (needed for vite preview)
RUN bun install --frozen-lockfile

USER lyrprep

EXPOSE 4173
CMD ["bun", "run", "preview"]