# Builder stage.

FROM node:14-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig*.json ./

RUN npm ci --quiet

COPY ./src ./src

RUN npm run build


# Production Stage

FROM node:14-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --quiet --only=production

COPY --from=builder /usr/src/app/dist ./dist
