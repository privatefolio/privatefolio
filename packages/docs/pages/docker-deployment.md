---
description: Build and deploy Privatefolio using Docker
---

# Docker deployment

Deploying Privatefolio via Docker requires us to build a Docker image that packages both `@privatefolio/backend` and `@privatefolio/frontend` alongside their dependencies.

Are you looking to self-host Privatefolio using the official Docker image? Go to [Self-hosting](./self-hosting-with-docker.md).

## Prerequisites

Before we get started you must have Docker installed:

```sh
docker --version
# Docker version 28.3.2, build 578ccf6
```

If you don't have it, get it from [docker.com](https://docs.docker.com/get-docker/).

## Building the image

```sh
yarn docker:build
```

## Running the container

```sh
yarn docker:run # start a container named privatefolio
yarn docker:remove # remove the container
```

## Building the image manually

To build the image without using the npm scripts:

```sh
docker build -t privatefolio -f packages/backend/Dockerfile .
```

To run the container:

```sh
docker run -d -p ${PORT:-5555}:${PORT:-5555} -v privatefolio-data:/app/data --name privatefolio privatefolio
```

## Accessing the app

The app will be available on the port you set in `docker run` (defaulting to `5555`):

Visit [`http://localhost:5555`](http://localhost:5555) in your browser.

## Dockerfile

The Docker image uses a multi-stage build process. It builds the frontend bundle and installs backend production dependencies.
The final image utilizes Bun to serve the compiled JavaScript build of the backend and the pre-built frontend bundle.

```yaml [packages/backend/Dockerfile]
// [!include ~/../../packages/backend/Dockerfile]
```

## Configuration

You can customize the `PORT` variable at runtime, by passing it to the `docker run` command with the `-e` flag:

```sh
docker run -d -p 5000:5000 -v privatefolio-data:/app/data -e PORT=5000 --name privatefolio privatefolio
```

## Data Persistence

All data is stored in the `/app/data` directory inside the container, which is mounted to a persistent volume called `privatefolio-data`. This ensures that your data is persisted even if the container is stopped or removed.

To backup your data, you can use the Docker volume commands:

```sh
docker volume inspect privatefolio-data # View volume info
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

## Official deployment

We are currently deploying to GitHub Container Registry (GHCR) through a GitHub Actions workflow.
This deployment system provides continuous deployment for all tagged releases and branches, with Discord notifications for deployment status updates.

```sh
docker pull ghcr.io/privatefolio/privatefolio:latest
```

See all versions at [ghcr.io/privatefolio/privatefolio](https://github.com/privatefolio/privatefolio/pkgs/container/privatefolio).

Available image tags:

- `latest`: Latest tagged release
- `v*.*.*`: Tagged releases (e.g., v2.0.0-beta.40)
- `******`: Git commit (e.g. 1da1a8f)

To run the official image:

```sh
docker run -d -p ${PORT:-5555}:${PORT:-5555} -v privatefolio-data:/app/data --name privatefolio ghcr.io/privatefolio/privatefolio:latest
```

Learn more on [self-hosting with Docker](./self-hosting-with-docker.md).

## Workflow file

```yaml [.github/workflows/publish-docker-image.yml]
// [!include ~/../../.github/workflows/publish-docker-image.yml]
```
