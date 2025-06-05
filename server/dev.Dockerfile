FROM node:lts-alpine3.20 AS dev-stage
RUN apk add --no-cache tini
ENV NODE_ENV=development
ENV DEBUG=backend_carevault:*
WORKDIR /usr/src/app
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
USER node
ENTRYPOINT [ "/sbin/tini", "--"]
CMD ["npm", "run", "dev", "--", "--host"]