# Docker Setup for Privatefolio Backend

This document explains how to use Docker to run the Privatefolio backend service.
The Docker image utilizes Bun to run the TypeScript source code directly, removing the need for a separate build step.

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

To build the image from the packages/backend directory:

```sh
docker build -t privatefolio -f Dockerfile ../..
```

To run the container:

```sh
docker run -d -p 4001:4001 -v privatefolio-data:/app/data --name privatefolio privatefolio
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
docker run -d -p 4001:4001 -v privatefolio-data:/app/data --name privatefolio ghcr.io/privatefolio/privatefolio:latest
```

## Configuration

The backend service is configured with the following environment variables:

- `PORT`: The port to run the server on (default: 4001)
- `NODE_ENV`: The environment to run in (default: production)
- `DATA_LOCATION`: The directory to store data in (default: /app/data)

You can customize these by passing them to the `docker run` command with the `-e` flag:

```sh
docker run -d -p 4001:4001 -v privatefolio-data:/app/data -e PORT=5000 -e NODE_ENV=development --name privatefolio privatefolio
```

## Data Persistence

All data is stored in the `/app/data` directory inside the container, which is mounted to a named volume called `privatefolio-data`. This ensures that your data is persisted even if the container is stopped or removed.

To backup your data, you can use the Docker volume commands:

```sh
docker volume inspect privatefolio-data # View volume info
```

## Accessing the API

The backend API will be available at:

- HTTP: `http://localhost:4001`
- WebSocket: `ws://localhost:4001`

You can check if the service is running by visiting `http://localhost:4001` in your browser or using curl:

```sh
curl http://localhost:4001
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

A GitHub Actions workflow is set up to automatically build and publish Docker images to GitHub Container Registry (GHCR) on each push to the main branch and on tag creation. The workflow file is located in `.github/workflows/docker-publish.yml`.

Available image tags:
- `latest`: Latest build from the main branch
- `v*.*.*`: Tagged releases (e.g., v2.0.0-alpha.5)
- `sha-******`: Short commit SHA for each build 
