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

## `github-pr`

Post build status and PR comment with detailed report

- [Authorize `BundleMon`](https://bundlemon.now.sh/setup-github) and copy the token
- Add the token to `BUNDLEMON_GITHUB_TOKEN` environment variable in your CI

### Example

Use default options

```
"reportOutput": ["github-pr"]
```

Override default options

```
"reportOutput": [
  [
    "github-pr",
    {
      "statusCheck": true,
      "prComment": true
    }
  ]
]
```

### Options

#### `statusCheck`

type: `boolean` default: `true`

Post build status

#### `prComment`

type: `boolean` default: `false`

Post comment on PR
