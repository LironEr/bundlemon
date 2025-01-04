FROM node:20-alpine

ENV HOST=0.0.0.0 PORT=3333 SHOULD_SERVE_WEBSITE=true NODE_ENV=production

WORKDIR /app

RUN addgroup --system service && adduser --system -G service service

# Needed by @fastify/secure-session & for source maps
RUN npm i sodium-native@^4.0.0 source-map-support@0.5.21

COPY dist service

RUN chown -R service:service .

CMD [ "node", "-r", "source-map-support/register", "service/app.js" ]