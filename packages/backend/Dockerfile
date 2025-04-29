# 1) Builder: use Alpine + Yarn (needs Node) to install prod deps
FROM oven/bun:1-alpine AS builder

# install Node.js & Yarn so you can still use yarn install
RUN apk add --no-cache nodejs npm \
 && npm install -g yarn

WORKDIR /app
COPY package.json yarn.lock lerna.json ./
COPY packages/backend/package.json ./packages/backend/

# Install dependencies using Yarn (including devDependencies for TS runtime)
RUN yarn install --production --frozen-lockfile

# Copy the entire monorepo source code
COPY . .

# 2) Runtime: only Bun, your prod-deps & source
FROM oven/bun:1-alpine AS runtime

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
