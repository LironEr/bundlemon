# Custom Path Labels

By default path labels replace only `<hash>`, but you can customize it and add more labels by defining `pathLabels` in your config.

### Default labels:

```json
{
  "pathLabels": {
    "hash": "[a-zA-Z0-9\\-_]+"
  }
}
```

### Adding more labels:

```json
{
  "baseDir": "./build",
  "pathLabels": {
    "chunkId": "[\\w-]+"
  },
  "files": [
    {
      "path": "*.<hash>.chunk.<chunkId>.js"
    },
    {
      "path": "*.<hash>.js"
    }
  ]
}
```

### Customizing and adding more labels:

```json
{
  "baseDir": "./build",
  "pathLabels": {
    "hash": "[a-z]+",
    "chunkId": "[\\w-]+"
  },
  "files": [
    {
      "path": "*.<hash>.chunk.<chunkId>.js"
    },
    {
      "path": "*.<hash>.js"
    }
  ]
}
```
