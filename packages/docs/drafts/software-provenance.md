# Software Provenance

This document explains how to verify the build provenance of Privatefolio artifacts using GitHub's artifact attestations.

## What is Software Provenance?

Software provenance provides verifiable information about how software artifacts were built, including:

- **Source Commit**: The exact commit hash that was used to build the artifact
- **Build Environment**: Where the build was executed (GitHub Actions)
- **Build File**: The specific workflow file that performed the build
- **Transparency Log**: Cryptographic proof stored in a public transparency log

## Privatefolio Provenance

All Privatefolio releases include artifact attestations that provide build provenance. This means you can verify:

- The artifacts were built from the official Privatefolio repository
- The build was executed on GitHub Actions runners
- The exact source code commit used for the build
- The workflow file that performed the build

## Verifying Attestations

### Prerequisites

You need the GitHub CLI installed:

```sh
gh --version
# gh version 2.74.2 (2025-06-18)
```

If you don't have it, get it from [cli.github.com](https://cli.github.com/).

### Verifying NPM Packages

NPM packages published with provenance can be verified using npm's built-in audit feature (requires npm 9.5.0+):

```sh
# Install packages and verify provenance
npm install @privatefolio/commons @privatefolio/commons-node
npm audit signatures
```

This will show output like:

```sh
audited 1267 packages in 6s

1267 packages have verified registry signatures
74 packages have verified attestations
```

You can also view provenance information directly on the npm package pages:

- [@privatefolio/commons](https://www.npmjs.com/package/@privatefolio/commons)
- [@privatefolio/commons-node](https://www.npmjs.com/package/@privatefolio/commons-node)

The provenance information will include:

- **Built and signed on**: GitHub Actions
- **Source commit**: The exact commit hash used for the build
- **Build file**: `.github/workflows/publish-libraries.yml`
- **Public ledger**: Link to Sigstore transparency log entry

### Verifying Docker Images

To verify the provenance of Docker images:

```sh
# Verify the latest Docker image
gh attestation verify oci://ghcr.io/privatefolio/privatefolio:latest --owner privatefolio

# Verify a specific version
gh attestation verify oci://ghcr.io/privatefolio/privatefolio:v2.0.0-beta.45 --owner privatefolio
```

### Verifying Desktop Apps

To verify desktop application binaries, first download the release artifacts:

```sh
# Download the latest release artifacts
gh release download --repo privatefolio/privatefolio

# Verify Windows installer
gh attestation verify "Privatefolio Setup 2.0.0-beta.45.exe" --owner privatefolio

# Verify Linux package
gh attestation verify "privatefolio-electron_2.0.0-beta.45_amd64.deb" --owner privatefolio

# Verify macOS DMG
gh attestation verify "Privatefolio-2.0.0-beta.45-arm64.dmg" --owner privatefolio
```

### Verifying Mobile Apps

To verify mobile app builds:

```sh
# Verify Android APK (if available as release artifact)
gh attestation verify "app-release.apk" --owner privatefolio
```

## What You'll See

When you run the verification command, you'll see output similar to:

```
Loaded digest sha256:abcd1234... for oci://ghcr.io/privatefolio/privatefolio:latest
Loaded 1 attestation from GitHub API
✓ Verification succeeded!

sha256:abcd1234... was attested by:
REPO        PREDICATE_TYPE                 WORKFLOW
privatefolio/privatefolio  https://slsa.dev/provenance/v1  .github/workflows/publish-backend.yml@refs/tags/v2.0.0-beta.45
```

This tells you:

- **Repository**: The artifact was built from the official privatefolio/privatefolio repository
- **Predicate Type**: Uses the SLSA provenance standard
- **Workflow**: The specific GitHub Actions workflow that built the artifact
- **Tag/Commit**: The exact version tag or commit hash used for the build

## Transparency Log

All attestations are automatically stored in the public [Sigstore transparency log](https://search.sigstore.dev/), providing an immutable record that can be independently verified.

You can search for Privatefolio attestations at [search.sigstore.dev](https://search.sigstore.dev/) by searching for "privatefolio".

## Troubleshooting

### Authentication Required

If you see authentication errors, make sure you're logged into GitHub CLI:

```sh
gh auth login
```

### Attestation Not Found

If no attestations are found, it might be because:

1. The artifact was built before attestations were implemented
2. You're using the wrong artifact path or name
3. The attestation hasn't been generated yet (for very recent builds)

### Network Issues

If you're behind a corporate firewall, you may need to configure proxy settings for the GitHub CLI.

## Implementation Details

Privatefolio implements artifact attestations using:

- **GitHub Actions**: `actions/attest-build-provenance@v2`
- **Permissions**: `id-token: write` and `attestations: write`
- **Sigstore**: Automatic signing with GitHub's OIDC identity

The attestations are generated for:

- NPM packages (`@privatefolio/commons`, `@privatefolio/commons-node`)
- Docker images (`ghcr.io/privatefolio/privatefolio`)
- Desktop application binaries (`.exe`, `.deb`, `.dmg`)
- Mobile application packages (`.apk`)
- Frontend build artifacts

## Further Reading

- [GitHub Artifact Attestations Documentation](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations)
- [SLSA Framework](https://slsa.dev/)
- [Sigstore Project](https://www.sigstore.dev/)
- [Supply Chain Security Best Practices](https://github.com/ossf/wg-best-practices-os-developers)
