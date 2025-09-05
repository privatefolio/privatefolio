# Self-hosting with Docker

Deploying with Docker using the official deployment of Privatefolio which is available on GitHub Container Registry (GHCR).

## Prerequisites

Before we get started you must have Docker installed:

```sh
docker --version
# Docker version 28.3.2, build 578ccf6
```

If you don't have it, get it from [docker.com](https://docs.docker.com/get-docker/).

## 1. Pull the Image

```sh
docker pull ghcr.io/privatefolio/privatefolio:latest
```

This fetches the latest official release from GHCR.

## 2. Run the Container

```sh
docker run -d \
  -p ${PORT:-5555}:5555 \
  -v privatefolio-data:/app/data \
  --name privatefolio \
  ghcr.io/privatefolio/privatefolio:latest
```

Explanation:

- `-d`: Run in detached mode.
- `-p ${PORT:-5555}:5555`: Map the host port (default 5555) to the container port 5555. Adjust the host port if needed.
- `-v privatefolio-data:/app/data`: Mount a named volume `privatefolio-data` to `/app/data` inside the container for persistent data storage.
- `--name privatefolio`: Assign a name to the container.

## 3. Access the app

The app will be available on the port you set in `docker run` (defaulting to `5555`):

Visit [`http://localhost:5555`](http://localhost:5555) in your browser.

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

## Upgrading

To upgrade to the latest version of Privatefolio, run:

```sh
docker pull ghcr.io/privatefolio/privatefolio:latest
docker rm -f privatefolio
docker run -d -p ${PORT:-5555}:${PORT:-5555} -v privatefolio-data:/app/data --name privatefolio ghcr.io/privatefolio/privatefolio:latest
```

Your data is safe even when you remove the container, because it is persisted in the `privatefolio-data` volume.

## Delete all personal data

To delete all personal data, run:

```sh
docker rm -f privatefolio
docker volume rm privatefolio-data
```
