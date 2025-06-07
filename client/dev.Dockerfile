FROM node:lts-alpine3.20 AS dev-stage

# Install tini for proper signal handling and build dependencies
RUN apk add --no-cache tini python3 make g++ pkgconfig cairo-dev pango-dev giflib-dev

WORKDIR /usr/src/app
ENV NODE_ENV=development
ARG VITE_API_BASE_URL=http://localhost:3001/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Remove build dependencies to keep image small
RUN apk del make g++

# Copy application files
COPY . .

ENV NODE_PATH=/usr/src/shared

ENTRYPOINT [ "/sbin/tini", "--"]
CMD ["npm", "run", "dev", "--", "--host"]
