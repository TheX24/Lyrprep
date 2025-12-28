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

# Copy ALL necessary files from builder (config, plugins, etc.)
# We copy everything except node_modules (will reinstall) and dist (copy separately)
COPY --from=builder --chown=lyrprep:lyrprep /app/package.json ./
COPY --from=builder --chown=lyrprep:lyrprep /app/bun.lock ./
COPY --from=builder --chown=lyrprep:lyrprep /app/vite.config.ts ./
COPY --from=builder --chown=lyrprep:lyrprep /app/vite-plugins ./vite-plugins
COPY --from=builder --chown=lyrprep:lyrprep /app/tsconfig.json ./

# Install all dependencies including vite and plugins
RUN bun install --frozen-lockfile

# Copy the built assets
COPY --from=builder --chown=lyrprep:lyrprep /app/dist ./dist

USER lyrprep

EXPOSE 4173
CMD ["bun", "run", "preview"]