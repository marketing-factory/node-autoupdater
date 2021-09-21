FROM node:14-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apk add --no-cache git

COPY package.json package-lock.json ./

RUN npm ci --only=production

COPY dist/ ./

ENTRYPOINT ["node", "dist/index.js"]

CMD ["/user-project"]