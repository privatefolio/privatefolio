# Deploying Privatefolio using a Docker image

This document provides instructions on how to deploy Privatefolio using Docker, including examples for direct Docker usage and deployment via Fly.io.

## 1. Docker Deployment

Deploying with Docker utilizes the pre-built container images available on GitHub Container Registry (GHCR). This method encapsulates the application and its dependencies.
Alternatively, you can build the image locally using the [Docker Build documentation](DOCKER_BUILD.md).

### Prerequisites

- Docker installed

### Steps

1.  **Pull the Image:**
    ```sh
    docker pull ghcr.io/privatefolio/privatefolio:latest
    ```

2.  **Run the Container:**
    ```sh
    docker run -d \
      -p ${PORT:-5555}:5555 \
      -v privatefolio-data:/app/data \
      --name privatefolio \
      ghcr.io/privatefolio/privatefolio:latest
    ```
    - `-d`: Run in detached mode.
    - `-p ${PORT:-5555}:5555`: Map the host port (default 5555) to the container port 5555. Adjust the host port if needed.
    - `-v privatefolio-data:/app/data`: Mount a named volume `privatefolio-data` to `/app/data` inside the container for persistent data storage.
    - `--name privatefolio`: Assign a name to the container.

3.  **Configuration:**
    Environment variables like `PORT` and `DATA_LOCATION` can be passed using the `-e` flag in the `docker run` command. Note that `DATA_LOCATION` inside the container defaults to `/app/data`, which is already mapped to the volume.

    ```sh
    docker run -d \
      -p 5000:5000 \
      -e PORT=5000 \
      -v privatefolio-data:/app/data \
      --name privatefolio \
      ghcr.io/privatefolio/privatefolio:latest
    ```

For more detailed information on building the image locally, managing data, and accessing logs, refer to the [Docker Build documentation](DOCKER_BUILD.md).

## 2. Fly.io Deployment

Fly.io allows deploying containerized applications globally. Privatefolio includes a `fly.toml` configuration file for easy deployment on this platform using its Docker image.

### Prerequisites

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- A Fly.io account ([Sign up](https://fly.io/))

### Steps

1.  **Login to Fly.io:**
    ```sh
    fly auth login
    ```

2.  **Launch the App (First Time):**
    Navigate to the root directory of the Privatefolio repository where `fly.toml` is located. Run:
    ```sh
    fly launch --no-deploy
    ```
    - You will be asked if you wish to copy this configuration file to the new app. Answer `y` (yes).
    - This command reads the `fly.toml` file and sets up the application on Fly.io based on the configuration.
    - `--no-deploy`: We skip the initial deploy because we want to ensure the volume is created first.

3.  **Create a Persistent Volume:**
    The `fly.toml` specifies a volume mount for data persistence. Create the volume before the first deploy:
    ```sh
    fly volumes create privatefolio_data --size 1
    ```
    - `--size 1`: Specifies the volume size in GB (1 GB is usually sufficient to start).
    - You will be prompted to choose a region for the volume. Select the same region as your app for optimal performance.

4.  **Deploy the App:**
    ```sh
    fly deploy
    ```
    - This command uses the pre-built image specified in `fly.toml` from GHCR and deploys it to the Fly.io platform.
    - It respects the settings in `fly.toml`, including environment variables (`PORT=5555`), volume mounts (`privatefolio_data` to `/data`), and service configuration (HTTP service on the internal port).

### Subsequent Deployments

To deploy updates, simply run:
```sh
fly deploy
```
Fly.io will pull the latest `:latest` image from GHCR (or rebuild if configured differently) and deploy the new version.

### Accessing the Deployed App

After deployment, `fly deploy` will output the public URL for your application (e.g., `https://privatefolio.fly.dev`). The API will be available at this URL.

### Monitoring and Logs

Use `flyctl` to manage your deployed app:
- **Logs:** `fly logs -a <your-app-name>`
- **Status:** `fly status -a <your-app-name>`
