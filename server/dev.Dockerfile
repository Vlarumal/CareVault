FROM node:lts-alpine3.20 AS dev-stage

RUN apk add --no-cache tini postgresql-client

# ENV NODE_ENV=development
# ENV NODE_ENV=test
ENV DEBUG=backend_carevault:*

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
RUN npm ci
# RUN npm ci --include=dev || (npm install --include=dev && npm cache clean --force)

COPY --chown=node:node . .

ENV NODE_PATH=/usr/src/shared

# Copy schema.sql to /docker-entrypoint-initdb.d
# RUN mkdir -p /docker-entrypoint-initdb.d
# COPY db/schema.sql /docker-entrypoint-initdb.d/

EXPOSE 3001 3001

USER node
ENTRYPOINT [ "/sbin/tini", "--"]
CMD ["npm", "run", "dev", "--", "--host"]