# Contributing to BundleMon

Thanks for taking the time to contribute! ❤️

## Local development

### Prerequisites

- [Node.js](http://nodejs.org/) >= v12
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

Requires `docker` & `docker-compose`

#### Start service

When changing code in `service/` directory the service will reload itself

Run from root directory

```
yarn start:service
```

By default the service will start on port `3333`

#### Generate local data

The script will generate 3 projects, run it when the local service is running

```
yarn gen-local-data
```

#### Run tests

Run from `service/` directory

```bash
yarn start:mock-services
```

```bash
yarn test
```

### BundleMon website

```bash
yarn start
```

After running the command the website will be available at https://localhost:4000/

By default the local website will expect a local BundleMon service on port `3333`.
