# syntax=docker/dockerfile:1

###############################
# Builder: build Vite + TS app
###############################
FROM node:22-alpine AS builder

WORKDIR /app

# Enable Corepack to use pnpm from lockfile
RUN corepack enable

# Install dependencies first (better layer caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the source and build
COPY . .
RUN pnpm build

###############################
# Runtime: serve static via Nginx
###############################
FROM nginx:alpine AS runtime

# Copy built assets to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


