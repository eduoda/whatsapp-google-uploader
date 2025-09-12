# WhatsApp Google Uploader - Production Dockerfile
# AIDEV-NOTE: docker-main; production container for CLI application

# Use Node.js LTS Alpine for minimal size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for SQLite and native modules
RUN apk add --no-cache \
    sqlite \
    sqlite-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY tsconfig.json ./

# Copy workspace packages
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY shared/ ./shared/

# Install dependencies
RUN npm ci --only=production

# Build all packages and applications
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S uploader && \
    adduser -S uploader -u 1001

# Create directories for data persistence
RUN mkdir -p /data/progress /data/logs /data/config && \
    chown -R uploader:uploader /data

# Switch to non-root user
USER uploader

# Set environment variables
ENV NODE_ENV=production
ENV DATA_DIR=/data
ENV LOG_LEVEL=info

# Expose volume for persistent data
VOLUME ["/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node apps/cli/dist/bin/cli.js check --quick || exit 1

# Default command
ENTRYPOINT ["node", "apps/cli/dist/bin/cli.js"]
CMD ["--help"]