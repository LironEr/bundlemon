# Self hosted BundleMon platform

## Running with Docker

```sh
docker run --rm -p 8080:8080 -e MONGO_URL="mongodb://localhost:27017" ghcr.io/lironer/bundlemon-platform:v1
```

Full Docker compose example [here](./docker-compose.yaml).

You can also run with env var `SHOULD_SERVE_WEBSITE=false` to disable serving the website.

**Full details on all environment variables [here](../../apps/service/README.md).**

## MongoDB setup

Create your MongoDB, you can either create one in docker, your own machine or host on another service like MongoDB Atlas.

> you can create a free MongoDB [here](https://www.mongodb.com) (500 MB free).

## Setup BundleMon CLI

Set env var `BUNDLEMON_SERVICE_URL=https://your-bundlemon-service.domain/api` in your CI/CD.
