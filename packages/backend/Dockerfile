FROM node:20 as builder

WORKDIR /app

# Install yarn
RUN apt-get update && apt-get install -y curl && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn

# Copy package.json files for dependency installation
COPY package.json yarn.lock lerna.json ./
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the backend
RUN cd packages/backend && yarn build

# Runtime stage
FROM oven/bun:1-slim

WORKDIR /app

# Create directories for data
RUN mkdir -p data/databases data/logs data/files

# Copy built files and dependencies from builder stage
COPY --from=builder /app/packages/backend/build /app/packages/backend/build
COPY --from=builder /app/packages/backend/package.json /app/packages/backend/
COPY --from=builder /app/package.json /app/
COPY --from=builder /app/node_modules /app/node_modules

# Set environment variables
ENV PORT=4001
ENV NODE_ENV=production
ENV DATA_LOCATION=/app/data
ENV APP_VERSION="{\"privatefolio-backend\":\"2.0.0-alpha.5\"}"
ENV GIT_HASH=dockerized
ENV GIT_DATE="2023-06-01T12:00:00Z"

# Expose the port
EXPOSE 4001

# Set working directory to backend
WORKDIR /app/packages/backend

# Command to run the backend
CMD ["bun", "build/start.js"] 
