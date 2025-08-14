# 1) Backend Builder: use Alpine + Yarn (needs Node) to install prod deps
FROM oven/bun:1-alpine AS backend-builder

# Install Node.js & Yarn so you can use yarn install
RUN apk add --no-cache nodejs npm \
 && npm install -g yarn

WORKDIR /app
COPY package.json yarn.lock lerna.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/commons/package.json ./packages/commons/
COPY packages/commons-node/package.json ./packages/commons-node/

# Install dependencies using Yarn
RUN yarn install --production --frozen-lockfile

# Copy the entire monorepo source code
COPY . .

# 2) Frontend Builder: use Alpine + Yarn (needs Node) to bundle the frontend
FROM oven/bun:1-alpine AS frontend-builder

# Install Node.js & Yarn so you can use yarn install
RUN apk add --no-cache nodejs npm \
 && npm install -g yarn

WORKDIR /app
COPY package.json yarn.lock lerna.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/commons/package.json ./packages/commons/
COPY packages/commons-node/package.json ./packages/commons-node/

# Install dependencies using Yarn
RUN yarn install --frozen-lockfile

# Copy the entire monorepo source code
COPY . .

# Define build arguments
ARG APP_VERSION_ARG=unknown
ARG GIT_HASH_ARG=unknown
ARG GIT_DATE_ARG=unknown

RUN yarn workspace privatefolio-backend build
RUN NODE_ENV=production VITE_APP_VERSION=$APP_VERSION_ARG VITE_GIT_HASH=$GIT_HASH_ARG VITE_GIT_DATE=$GIT_DATE_ARG yarn workspace privatefolio-frontend build:custom

# 3) Runtime: only Bun, prod-deps, source code & frontend bundle
FROM oven/bun:1-alpine AS runtime

WORKDIR /app

# TODO6 image size jumped from 190MB to 240MB because of commons and commons-node (dev deps?)
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/packages/backend ./packages/backend
COPY --from=backend-builder /app/packages/commons ./packages/commons
COPY --from=backend-builder /app/packages/commons-node ./packages/commons-node
COPY --from=frontend-builder /app/packages/frontend/build ./packages/frontend/build

RUN mkdir -p /app/data/{databases,logs,files}

WORKDIR /app/packages/backend

# Define build arguments
ARG PORT_ARG=5555
ARG APP_VERSION_ARG=unknown
ARG GIT_HASH_ARG=unknown
ARG GIT_DATE_ARG=unknown

# Set environment variables using build arguments
ENV PORT=$PORT_ARG \
    NODE_ENV=production \
    DATA_LOCATION=/app/data \
    APP_VERSION=$APP_VERSION_ARG \
    GIT_HASH=$GIT_HASH_ARG \
    GIT_DATE=$GIT_DATE_ARG

# Expose the port
EXPOSE $PORT

# Set the default command to run when starting the container
CMD ["bun", "run", "src/start.ts"]
