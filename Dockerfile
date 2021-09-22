FROM node:14-alpine

ARG TARBALL_PATH
ENV TARBALL_PATH=${TARBALL_PATH:-*.tgz}
ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apk add --no-cache git

COPY $TARBALL_PATH ./ 

RUN npm install -g $TARBALL_PATH

ENTRYPOINT ["autoupdate"]

CMD ["/user-project"]