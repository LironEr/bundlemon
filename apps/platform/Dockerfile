FROM node:20-alpine

ENV SHOULD_SERVE_WEBSITE=true NODE_ENV=production

WORKDIR /app

RUN addgroup --system service && adduser --system -G service service

# Needed by @fastify/secure-session & for source maps
RUN set -ex; \
    apk add --no-cache --virtual .gyp \
        # Gyp build dependencies
        python3 make g++; \
        npm i sodium-native@4.2.0 source-map-support@0.5.21; \
    apk del .gyp

COPY dist service

RUN chown -R service:service .

CMD [ "node", "-r", "source-map-support/register", "service/app.js" ]