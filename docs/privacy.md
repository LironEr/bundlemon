# Privacy

## Data stored in the free hosted service

When using the free hosted service, the following information is stored for each record (commit) ([exact type definition](../apps/service/src/framework/mongo/commitRecords/types.ts#L30)):

- Project ID - stored in a separate collection
  - For GitHub projects, the collection contains owner and repository names
- Sub project name (if specified)
- Branch name
- Commit SHA
- Base branch name (for pull requests)
- Pull request number
- Commit message - Only when `includeCommitMessage` is enabled
- Files / Groups
  - Pattern
  - Friendly name (if specified)
  - File path
  - Size
  - Compression type
  - Size limits

Example record:

```json
{
  "_id": "6897284dd96dcac9c6449c84",
  "branch": "dependabot/npm_and_yarn/npm_and_yarn-45ede89f0a",
  "commitSha": "472e405f5261fc02f3af8ba491b5fc121dbff98d",
  "baseBranch": "main",
  "prNumber": "245",
  "projectId": "60a928cfc1ab380009f5cc0b",
  "creationDate": "2025-08-09T10:51:57.069Z",
  "files": [
    {
      "compression": "none",
      "pattern": "index.html",
      "matches": [
        {
          "path": "index.html",
          "size": 869
        }
      ]
    },
    {
      "compression": "none",
      "friendlyName": "JS files",
      "pattern": "assets/**/*-<hash>.js",
      "matches": [
        {
          "path": "assets/Alert-(hash).js",
          "size": 5913
        },
        {
          "path": "assets/AlertTitle-(hash).js",
          "size": 659
        }
      ]
    },
    {
      "compression": "none",
      "pattern": "assets/Main-*-<hash>.js",
      "matches": [
        {
          "path": "assets/Main-index-(hash).js",
          "size": 473258
        }
      ]
    }
  ],
  "groups": [
    {
      "compression": "none",
      "friendlyName": "JS files",
      "pattern": "**/*.js",
      "size": 1252544
    }
  ],
  "outputs": {
    "github": {
      "owner": "LironEr",
      "repo": "bundlemon",
      "outputs": {
        "commitStatus": 38346868576,
        "prComment": 3170605595
      }
    }
  }
}
```
