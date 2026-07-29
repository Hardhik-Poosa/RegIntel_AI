# ── Stage 1: Node.js builder ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer-cached unless package.json changes)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Pass the backend URL in at build time.
# Example: docker build --build-arg VITE_API_URL=https://api.regintel.ai/api/v1 .
# Falls back to /api/v1 so the Nginx proxy works when both run on the same host.
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}

COPY . .
RUN npm run build

# ── Stage 2: Nginx runtime ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Write a minimal SPA-friendly nginx config inline
RUN printf '\
server {\n\
    listen       80;\n\
    listen  [::]:80;\n\
    server_name  _;\n\
\n\
    root   /usr/share/nginx/html;\n\
    index  index.html;\n\
\n\
    # Proxy /api requests to the backend (used when running via docker-compose)\n\
    location /api/ {\n\
        proxy_pass         http://backend:8000/api/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header   Upgrade $http_upgrade;\n\
        proxy_set_header   Connection keep-alive;\n\
        proxy_set_header   Host $host;\n\
        proxy_set_header   X-Real-IP $remote_addr;\n\
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header   X-Forwarded-Proto $scheme;\n\
        proxy_read_timeout 120s;\n\
    }\n\
\n\
    # Serve static assets with long-lived cache headers\n\
    location /assets/ {\n\
        expires     1y;\n\
        add_header  Cache-Control "public, immutable";\n\
        try_files   $uri =404;\n\
    }\n\
\n\
    # React Router — any unknown path falls back to index.html\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # Security headers\n\
    add_header X-Frame-Options        "SAMEORIGIN"     always;\n\
    add_header X-Content-Type-Options "nosniff"        always;\n\
    add_header Referrer-Policy        "strict-origin"  always;\n\
\n\
    # Gzip\n\
    gzip            on;\n\
    gzip_types      text/plain text/css application/json application/javascript\n\
                    text/xml application/xml image/svg+xml;\n\
    gzip_min_length 1024;\n\
    gzip_vary       on;\n\
}\n\
' > /etc/nginx/conf.d/app.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
