# Docker Setup for Privatefolio Backend

This document explains how to use Docker to run the Privatefolio backend service.
The Docker image uses a multi-stage build process. It builds the frontend bundle and installs backend production dependencies.
The final image utilizes Bun to run the backend TypeScript source code directly.

## Requirements

- [Docker](https://docs.docker.com/get-docker/)

## Building and Running

### Using npm/yarn scripts

From the root directory, you can use the following scripts:

```sh
# Build the Docker image
yarn docker:build

# Build and run the Docker container
yarn docker:run

# Remove the Docker container
yarn docker:remove
```

Or from the packages/backend directory:

```sh
# Build the Docker image
yarn docker:build

# Build and run the Docker container
yarn docker:run

# Remove the Docker container
yarn docker:remove
```

### Using Docker Directly

To build the image from the `packages/backend` directory:

```sh
docker build -t privatefolio -f Dockerfile ../..
```

To run the container:

```sh
docker run -d -p ${PORT:-5555}:${PORT:-5555} -v privatefolio-data:/app/data --name privatefolio privatefolio
```

To stop the container:

```sh
docker stop privatefolio
```

### Using Pre-built Images from GitHub Container Registry

Pre-built Docker images are available on GitHub Container Registry:

```sh
docker pull ghcr.io/privatefolio/privatefolio:latest
```

To run the pre-built image:

```sh
docker run -d -p ${PORT:-5555}:${PORT:-5555} -v privatefolio-data:/app/data --name privatefolio ghcr.io/privatefolio/privatefolio:latest
```

## Configuration

The backend service is configured with the following environment variables, set during the Docker build process or runtime:

- `PORT`: The port to run the server on (default: 5555)
- `NODE_ENV`: The environment to run in (default: production)
- `DATA_LOCATION`: The directory to store data in (default: /app/data)
- `APP_VERSION`: The application version (set via build arg `APP_VERSION_ARG`)
- `GIT_HASH`: The git commit hash (set via build arg `GIT_HASH_ARG`)
- `GIT_DATE`: The git commit date (set via build arg `GIT_DATE_ARG`)

You can customize `PORT` and `NODE_ENV` at runtime by passing them to the `docker run` command with the `-e` flag:

```sh
docker run -d -p 5000:5000 -v privatefolio-data:/app/data -e PORT=5000 -e NODE_ENV=development --name privatefolio privatefolio
```
Note: `APP_VERSION`, `GIT_HASH`, and `GIT_DATE` are baked into the image during build and typically aren't overridden at runtime.

## Data Persistence

All data is stored in the `/app/data` directory inside the container, which is mounted to a named volume called `privatefolio-data`. This ensures that your data is persisted even if the container is stopped or removed.

To backup your data, you can use the Docker volume commands:

```sh
docker volume inspect privatefolio-data # View volume info
```

## Accessing the API

The backend API will be available at (defaulting to port 5555 if PORT is not set):

- HTTP: `http://localhost:${PORT:-5555}`
- WebSocket: `ws://localhost:${PORT:-5555}`

You can check if the service is running by visiting `http://localhost:${PORT:-5555}` in your browser or using curl:

```sh
curl http://localhost:${PORT:-5555}
```

## Logs

To view logs from the container:

```sh
docker logs privatefolio
```

To follow the logs in real-time:

```sh
docker logs -f privatefolio
```

## Continuous Integration

A GitHub Actions workflow is set up to automatically build and publish Docker images to GitHub Container Registry (GHCR) on each push to the main branch and on tag creation. The workflow file is located in `.github/workflows/docker-publish.yml`. It passes build arguments like version and git info to the Docker build.

Available image tags:
- `latest`: Latest build from the main branch
- `v*.*.*`: Tagged releases (e.g., v2.0.0-alpha.5)
- `sha-******`: Short commit SHA for each build
