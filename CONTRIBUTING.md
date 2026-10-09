# Contributing to BundleMon

Thanks for taking the time to contribute! ❤️

## Local development

### Prerequisites

- [Node.js](https://nodejs.org/) >= v18
- [Yarn](https://yarnpkg.com/en/docs/install)

#### Install dependencies

```bash
yarn install
```

#### Build packages

```bash
yarn build-packages
```

### BundleMon CLI

#### Test packages

```bash
yarn test-packages
```

### BundleMon Service

Requires `docker` & `docker compose`

#### Start service

When changing code in `apps/service/` directory the service will reload itself

Run from `apps/service/` directory

```
yarn serve
```

By default the service will start on port `3333`

#### Generate local data

The script will generate 3 projects, run it when the local service is running

```
yarn gen-local-data
```

#### Run tests

Run from `apps/service/` directory

```bash
yarn start:mock-services
```

```bash
yarn test
```

### BundleMon website

```bash
yarn serve
```

After running the command the website will be available at https://localhost:4000/

By default the local website will expect a local BundleMon service on port `3333`.

## Publishing a new version

Packages (`bundlemon`, `bundlemon-utils`, `bundlemon-markdown-output`) are versioned independently with [Nx Release](https://nx.dev/docs/guides/nx-release) (configured in the `release` section of [nx.json](nx.json)) and published to npm by GitHub Actions. No npm token is involved, the workflow authenticates to npm using [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC).

### Publish a package

1. Checkout an up to date `main` branch with a clean working tree. The release commit is pushed directly to the current branch, so you need push access to it.
2. Make sure you are logged in with `gh auth login`, or have `GITHUB_TOKEN` / `GH_TOKEN` set, it is used to create the GitHub release.
3. Preview the release, nothing is changed in dry-run mode:

   ```bash
   yarn nx release --projects bundlemon --skip-publish --dry-run
   ```

4. Run the release:

   ```bash
   yarn nx release --projects bundlemon --skip-publish
   ```

   Replace `bundlemon` with the package you want to release. The command will:

   - Calculate the next version from the [conventional commits](https://www.conventionalcommits.org/) since the package's last tag (`feat` → minor, `fix` → patch, `!` / `BREAKING CHANGE` → major). To set the version manually pass it as an argument, e.g. `yarn nx release 3.2.0 --projects bundlemon --skip-publish`
   - Update `version` in the package's `package.json` and add an entry to its `CHANGELOG.md`
   - Commit the changes (`chore(release): <package> bump version`) and create the `<package>@v<version>` git tag
   - Push the commit and the tag to `origin`
   - Create a GitHub release

   `--skip-publish` is required, publishing is done by CI and not from your machine.

5. Pushing the tag triggers the [publish-packages](.github/workflows/publish-packages.yml) workflow. It verifies that the `package.json` version matches the tag, builds the package and publishes it to npm with provenance. Follow the run in the repository's Actions tab and verify with `npm view <package> version`.

If a package depends on a newer version of another workspace package (e.g. `bundlemon` on `bundlemon-utils`), release the dependency first and update the version range in the dependent package before releasing it.

### One-time npm setup

Each package needs a trusted publisher configured on npmjs.com (package → Settings → Trusted Publisher → GitHub Actions):

- Organization or user: `LironEr`
- Repository: `bundlemon`
- Workflow filename: `publish-packages.yml`
- Environment: leave empty

The workflow needs Node.js 24 (npm >= 11.5.1) and the `id-token: write` permission, both already configured.
