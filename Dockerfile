FROM node:16-alpine

ARG TARBALL_PATH
ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apk add --no-cache git
RUN git config --global user.email "autoupdater@example.com" && git config --global user.name "Autoupdater"

COPY $TARBALL_PATH ./ 

RUN npm install -g $TARBALL_PATH

ENTRYPOINT ["autoupdate"]

CMD ["/user-project"]