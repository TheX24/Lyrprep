
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

# Copy ALL source files from builder
COPY --from=builder --chown=lyrprep:lyrprep /app/. ./

# Install ALL dependencies including devDependencies
# Vite preview needs vite, typescript, and plugins
ENV NODE_ENV=development
RUN bun install --frozen-lockfile

USER lyrprep

EXPOSE 3000
CMD ["bun", "run", "start"]