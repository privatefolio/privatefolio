---
title: Self-hosting with Fly.io
description: Deploy Privatefolio to the edge using Fly.io cloud platform
---

# Self-hosting with Fly.io

Deploying to Fly.io to self-host Privatefolio on the edge using the official Docker image from GitHub Container Registry (GHCR). Privatefolio includes a `fly.toml` configuration file for easy deployment on this cloud provider.

## Prerequisites

Before we get started you must have Fly.io CLI installed:

```sh
flyctl version
# v0.3.112
```

If you don't have it, get it from [Fly.io](https://fly.io/docs/hands-on/install-flyctl/).

You must also have a Fly.io account ([Sign up](https://fly.io/)).

## 1. Login to Fly.io

```sh
fly auth login
```

## 2. Create the app

Navigate to the root directory of the Privatefolio repository where `fly.toml` is located. Run:

```sh
fly launch --no-deploy
```

- You will be asked if you wish to copy this configuration file to the new app. Answer `y` (yes).
- This command reads the `fly.toml` file and sets up the application on Fly.io based on the configuration.
- `--no-deploy`: We skip the initial deploy because we want to ensure the volume is created first.

## 3. Create a persistent volume

The `fly.toml` specifies a volume mount for data persistence. Create the volume before the first deploy:

```sh
fly volumes create privatefolio-data --size 1
```

- `--size 1`: Specifies the volume size in GB (1 GB is usually sufficient to start).
- You will be prompted to choose a region for the volume. Select the same region as your app for optimal performance.

## 4. Deploy the app

```sh
fly deploy
```

- This command uses the pre-built image specified in `fly.toml` from GHCR and deploys it to the Fly.io platform.
- It respects the settings in `fly.toml`, including environment variables (`PORT=5555`), volume mounts (`privatefolio-data` to `/app/data`), and service configuration (HTTP service on the internal port).

## 5. Access the app

After deployment, `fly deploy` will output the public URL for your application (e.g., `https://privatefolio.fly.dev`). The app will be available at this URL.

Visit your Fly.io app URL in your browser to access Privatefolio.

## fly.toml

This is the configuration file for the Fly.io app.

```yaml [fly.toml]
// [!include ~/../../fly.toml]
```

## Data Persistence

All data is stored in the `/app/data` directory inside the container, which is mounted to a persistent volume called `privatefolio-data`. This ensures that your data is persisted even if the app is redeployed or restarted.

To backup your data, you can use Fly.io volume commands:

```sh
fly volumes list                    # List all volumes
fly volumes show privatefolio-data  # View volume details
```

## Logs

To view logs from your Fly.io app:

```sh
fly logs -a <your-app-name>
```

To follow the logs in real-time:

```sh
fly logs -f -a <your-app-name>
```

## Upgrading

To upgrade to the latest version of Privatefolio, run:

```sh
fly deploy
```

Fly.io will pull the latest image from GHCR and deploy the new version.

## Monitoring and Management

Use `flyctl` to manage your deployed app:

- App status: `fly status -a <your-app-name>`
- Machine status: `fly machine list -a <your-app-name>`
- Logs: `fly logs -a <your-app-name>`
- SSH access: `fly ssh console -a <your-app-name>`
- Scale: `fly scale count 2 -a <your-app-name>` (increase instances)

## Delete all personal data

To delete all personal data and remove your Fly.io deployment:

```sh
# Delete the app (this also removes associated volumes)
fly apps destroy <your-app-name>

# Or manually delete volume first, then app
fly volumes destroy privatefolio-data -a <your-app-name>
fly apps destroy <your-app-name>
```
