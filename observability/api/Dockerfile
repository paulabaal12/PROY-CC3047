FROM node:22-alpine
WORKDIR /app
COPY reference/catalog-reference.json /app/reference/catalog-reference.json
COPY observability/api/server.mjs /app/observability/api/server.mjs
ENV API_PORT=3000
ENV API_LOG_PATH=/var/log/centralamerica-games/api.log
EXPOSE 3000
CMD ["node", "/app/observability/api/server.mjs"]
