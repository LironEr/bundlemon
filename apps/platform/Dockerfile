FROM node:20-alpine

ENV NODE_ENV=production

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

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \
  CMD sh -c "curl -f http://localhost:${PORT-8080}/is-alive || exit 1"
