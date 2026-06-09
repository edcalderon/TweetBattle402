# Changelog

## [1.0.3] - 2026-06-08

### Added
- Add a GitHub Actions workflow that monitors Cloud Build with GitHub OIDC and no stored GCP JSON key.

### Changed
- Simplify the footer into a compact desktop/mobile strip with a single Monad Testnet Explorer link.
- Bump the workspace release version and Cloud Build image tag to `1.0.3`.

## [1.0.2] - 2026-06-08

### Fixed
- Fall back to demo battles when Monad RPC requests fail on the landing and battles pages.
- Keep battle-room hydration resilient when on-chain data is still incomplete.

### Added
- Add `@edcalderon/versioning` and a repo-level release config for synced monorepo releases.
- Surface the app version in the landing footer.

### Changed
- Bump the workspace release version and Cloud Build image tag to `1.0.2`.
