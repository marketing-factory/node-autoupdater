FROM node:16-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apk add --no-cache git
RUN git config --global user.email "autoupdater@example.com" && git config --global user.name "Autoupdater"

RUN TARBALL_PATH=$(ls *.tgz | tail -n 1)

COPY $TARBALL_PATH container-cmd.sh ./ 

RUN npm install -g $TARBALL_PATH

CMD ["/bin/sh", "container-cmd.sh"]