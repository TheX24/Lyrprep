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

# Runtime: serve static via Nginx
FROM nginx:alpine AS runtime

# Create non-root user and setup directories as ROOT
RUN addgroup -g 1001 lyrprep && \
    adduser -D -u 1001 -G lyrprep lyrprep && \
    chown -R lyrprep:lyrprep /var/cache/nginx /var/log/nginx /var/run /etc/nginx/conf.d /usr/share/nginx/html

# Write nginx config as ROOT
RUN echo "user lyrprep; worker_processes auto; error_log /var/log/nginx/error.log warn; pid /var/run/nginx.pid; events { worker_connections 1024; } http { include /etc/nginx/mime.types; default_type application/octet-stream; sendfile on; keepalive_timeout 65; server { listen 8080; server_name _; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } } }" > /etc/nginx/nginx.conf

# Switch to non-root user AFTER all setup is done
USER lyrprep

# Copy built assets (will be owned by lyrprep since we're running as that user now)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]