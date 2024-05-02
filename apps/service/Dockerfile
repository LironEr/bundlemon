FROM --platform=linux/amd64 docker.io/node:20-alpine

ENV HOST=0.0.0.0
ENV PORT=3333

WORKDIR /app

RUN addgroup --system service && adduser --system -G service service

# Needed by @fastify/secure-session 
RUN npm i sodium-native@^4.0.0

COPY dist service

RUN chown -R service:service .

CMD [ "node", "service/app.js" ]
