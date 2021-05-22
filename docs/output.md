# Output

```
"reportOutput": [
  [
    "output-plugin",
    "output-plugin-with-options",
    {
      "option1": "val",
      "option2": true
    }
  ]
]
```

## `github`

Create check run, post commit status and a detailed comment on your PR.

[Install BundleMon GitHub App](https://github.com/apps/bundlemon)

### Example

Use default options

```
"reportOutput": ["github"]
```

Override default options

```
"reportOutput": [
  [
    "github-pr",
    {
      "checkRun": false,
      "commitStatus": true,
      "prComment": true
    }
  ]
]
```

### Options

#### `checkRun`

type: `boolean` default: `true`

Creates check run, add a check to GitHub checks page, will also create commit status.

<img src="../assets/check-run.png" alt="check run" height="400px" />

#### `commitStatus`

type: `boolean` default: `false`

Post commit status

<img src="../assets/build-status-fail-max-size.png" alt="failed commit status" height="50px" />

#### `prComment`

type: `boolean` default: `false`

Post comment on PR

<img src="../assets/pr-comment.png" alt="pr comment" height="300px" />
