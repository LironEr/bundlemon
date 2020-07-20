<div align="center">
  <img src="./assets/bundlemon-optimized.svg" alt="BundleMon logo" width="150px" height="150px" />
</div>

# BundleMon

[![npm](https://img.shields.io/npm/v/bundlemon)](http://www.npmjs.com/package/bundlemon)
[![node](https://img.shields.io/node/v/bundlemon.svg)](https://github.com/LironEr/bundlemon)

Monitor your bundle size

## Setup

```
npm install bundlemon --save-dev

# or

yarn add bundlemon --dev
```

add `bundlemon` property to your `package.json`

```
"bundlemon": {
  "baseDir": "./build",
  "files": [
    {
      "path": "index.html",
      "maxSize": "2kb"
    },
    {
      "path": "bundle.<hash>.js",
      "maxSize": "10kb"
    },
    {
      "path": "assets/**/*.{png,svg}"
    }
  ]
}
```

BundleMon config can be placed in other places like: `.bundlemonrc`, `.bundlemonrc.json`, `bundlemon.config.js` exporting a JS object, more forms can be found [here](https://github.com/davidtheclark/cosmiconfig)

| Name               | Description                                                 | Type                             | Default  |
| ------------------ | ----------------------------------------------------------- | -------------------------------- | -------- |
| baseDir            | Relative/absolute path to the directory                     | `string` **required**            | -        |
| files              | [Files config](./docs/types.md#File)                        | `File[]` **required**            | -        |
| defaultCompression | Use compression before calculating file size                | `"none"` \| `"gzip"`             | `"gzip"` |
| reportOutput       | [Output options](./docs/output.md)                          | `(string \| [string, object])[]` | []       |
| onlyLocalAnalyze   | Don't communicate with the service, just validate `maxSize` | `boolean`                        | `false`  |
| verbose            | Print more details                                          | `boolean`                        | `false`  |

## Create new project

In order to save history and get differences from your main branches you will need to create a new project and setup environment variables.

- [Create new project](https://bundlemon.now.sh/create-project) and copy the project ID and API key
- Add the ID to `BUNDLEMON_PROJECT_ID` and the API key to `BUNDLEMON_PROJECT_APIKEY` environment variables in your CI

## Set additional environment variables

BundleMon uses [ci-env](https://github.com/siddharthkp/ci-env) under the hood, there no need to set anything if you are already using one of [ci-env](https://github.com/siddharthkp/ci-env) supported CI platform.

Currently supported CIs: travis, circle, gitlab, wercker, drone, codeship, now(zeit), netlify, GitHub Actions, Buddy and Codefresh.

#### Using a different CI?

You will need to set these environment variables:

- `CI_REPO_OWNER` - github.com/LironEr/bundlemon `LironEr`
- `CI_REPO_NAME` - github.com/LironEr/bundlemon `bundlemon`
- `CI_COMMIT_SHA` - commit sha
- `CI=true` - usually set automatically in CI environments
- `CI_TARGET_BRANCH` - only needed if you want to get diff from the target branch
- `CI_MERGE_REQUEST_ID` - PR number, only needed if you use `github-pr` output with post comment enabled

## Github integration

BundleMon can post build status and PR comment.

```
"reportOutput": [
  [
    "github-pr",
    {
      "statusCheck": true, // Default true
      "prComment": true // Default false
    }
  ]
]
```

- [Authorize `BundleMon`](https://bundlemon.now.sh/setup-github) and copy the token
- Add the token to `BUNDLEMON_GITHUB_TOKEN` environment variable in your CI

> The token is not passed to BundleMon service, ONLY used to communicate with Github

## Using hash in file names?

When using hash in file names the file name can be changed every build.

In order for BundleMon to keep track of your files you can use `<hash>` to replace the hash with a constant string.

For example:

```
index.html
home.b72f15a3.chunk.js
login.057c430b.chunk.js
bundle.ea45e578.js
```

Config:

```
"bundlemon": {
  "baseDir": "./build",
  "files": [
    {
      "path": "*.<hash>.chunk.js"
    },
    {
      "path": "*.<hash>.js"
    }
  ]
}
```

Output:

```
[PASS] bundle.<hash>.js: 19.67KB
[FAIL] home.<hash>.chunk.js: 70.09KB > 50KB
[PASS] login.<hash>.chunk.js: 3.37KB < 50KB
```

## Credits

- Inspired by [BundleWatch](https://github.com/bundlewatch/bundlewatch)
