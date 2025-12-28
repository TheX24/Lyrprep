# syntax=docker/dockerfile:1

# Builder: build Vite + TS app
FROM oven/bun:alpine AS builder

WORKDIR /app

# Create non-root user and group
RUN addgroup -g 1001 lyrprep && \
    adduser -D -u 1001 -G lyrprep lyrprep

# Install dependencies first (better layer caching)
COPY --chown=lyrprep:lyrprep package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the source and build
COPY --chown=lyrprep:lyrprep . .
RUN chown -R lyrprep:lyrprep /app

# Switch to non-root user and build
USER lyrprep
RUN bun run build

# Runtime: serve static via Nginx
FROM nginx:alpine AS runtime

# Create non-root user and group
RUN addgroup -g 1001 lyrprep && \
    adduser -D -u 1001 -G lyrprep lyrprep && \
    chown -R lyrprep:lyrprep /var/cache/nginx /var/log/nginx /var/run /etc/nginx/conf.d /usr/share/nginx/html

# Switch to non-root user for ALL operations
USER lyrprep

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Override nginx config to listen on port 8080 and run as lyrprep
RUN echo "user lyrprep; worker_processes auto; error_log /var/log/nginx/error.log warn; pid /var/run/nginx.pid; events { worker_connections 1024; } http { include /etc/nginx/mime.types; default_type application/octet-stream; sendfile on; keepalive_timeout 65; server { listen 8080; server_name _; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } } }" > /etc/nginx/nginx.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]