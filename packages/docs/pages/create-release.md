# Create a release

```sh
yarn new-version <major|minor|patch>
```

Note: this will trigger the `publish-*.yml` workflows, which will:

* publish the frontend to Cloudflare Pages.
* publish the backend to Docker Hub.
* build the native apps and attach them to the GitHub release.
