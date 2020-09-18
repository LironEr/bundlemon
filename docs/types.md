# Types

## File

#### `path`

type: `string` **required**

relative path to the file from `baseDir`

glob pattern is supported

```
"js/*.js"
"**/*.css"
"**/*.{js,css}"
"**/*.<hash>.js"
```

#### `compression`

value: `"none"` \| `"gzip"` optional

override default compression

#### `maxSize`

type: `string` optional

max size allowed for match file/files

```
"2000b"
"20kb"
"1mb"
```

#### `maxPercentIncrease`

type: `number` optional

max percent increase allowed for match file/files from base branch

```
0.5 = 0.5%
4   = 4%
200 = 200%
```
