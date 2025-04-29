FROM oven/bun:1-slim AS builder

WORKDIR /app

# Install yarn
# Bun's base image (debian) might not have curl/gnupg, install them first
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn && \
    # Clean up apt caches to reduce image size
    rm -rf /var/lib/apt/lists/*

# Copy necessary package manifests
COPY package.json yarn.lock lerna.json ./
COPY packages/backend/package.json ./packages/backend/

# Install dependencies using Yarn (including devDependencies for TS runtime)
RUN yarn install --production --frozen-lockfile

# Copy the entire monorepo source code
COPY . .

# 2) Runtime: only Bun, your prod-deps & source
FROM oven/bun:1-slim AS runtime
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/backend ./packages/backend

RUN mkdir -p /app/data/{databases,logs,files}

WORKDIR /app/packages/backend

# Set environment variables
ENV PORT=4001 \
    NODE_ENV=production \
    DATA_LOCATION=/app/data \
    APP_VERSION='{"privatefolio-backend":"2.0.0-alpha.5"}' \
    GIT_HASH=dockerized \
    GIT_DATE="2023-06-01T12:00:00Z"

# Expose the port
EXPOSE 4001

# Set the default command to run when starting the container
CMD ["bun", "run", "src/start.ts"]
