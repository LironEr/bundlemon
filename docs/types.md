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

#### `maxSize`

type: `string` optional

max size allowed for match file/files

```
"2000b"
"20kb"
"1mb"
```
