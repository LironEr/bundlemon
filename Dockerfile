FROM node:14-alpine

WORKDIR /app

EXPOSE 3333

COPY package.json yarn.lock ./
COPY service/package.json ./service/
COPY packages/bundlemon-utils/package.json ./packages/bundlemon-utils/

RUN yarn

COPY tsconfig.json ./

WORKDIR /app/packages/bundlemon-utils

COPY packages/bundlemon-utils/ .

RUN yarn build

WORKDIR /app/service

COPY service/ .

CMD ["yarn", "start:watch"]

