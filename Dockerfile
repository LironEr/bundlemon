FROM node:16-alpine

WORKDIR /app

EXPOSE 3333

COPY package.json yarn.lock ./
COPY service/package.json ./service/
COPY packages/bundlemon-utils/package.json ./packages/bundlemon-utils/
COPY packages/bundlemon-markdown-output/package.json ./packages/bundlemon-markdown-output/

RUN yarn

COPY tsconfig.json lerna.json ./

COPY packages/bundlemon-utils/ packages/bundlemon-utils/
COPY packages/bundlemon-markdown-output/ packages/bundlemon-markdown-output/

RUN yarn run build-packages

WORKDIR /app/service

COPY service/ .
