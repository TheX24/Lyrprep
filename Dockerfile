# syntax=docker/dockerfile:1

# Builder: build Vite + TS app
FROM oven/bun:alpine AS builder

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 lyrprep && \
    adduser -D -u 1001 -G lyrprep lyrprep

COPY --chown=lyrprep:lyrprep package.json bun.lockb ./
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

# Copy package.json and lockfile
COPY --from=builder --chown=lyrprep:lyrprep /app/package.json ./
COPY --from=builder --chown=lyrprep:lyrprep /app/bun.lockb ./

# Install vite (needed for preview) and dependencies
# Ensure vite is in your 'dependencies', not 'devDependencies', or use NODE_ENV=development
RUN bun install --frozen-lockfile

# Copy the built assets
COPY --from=builder --chown=lyrprep:lyrprep /app/dist ./dist

COPY --from=builder --chown=lyrprep:lyrprep /app/vite.config.ts ./

USER lyrprep

EXPOSE 4173
CMD ["bun", "run", "preview"]