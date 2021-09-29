# This Dockerfile expects that 'npm pack' was used to generate a tarball of
# this package with the name 'most-recent-tarball.tgz'

FROM node:16-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

RUN apk add --no-cache git && \
  git config --global user.email "autoupdater@example.com" && \
  git config --global user.name "Autoupdater"

COPY most-recent-tarball.tgz container-cmd.sh ./ 

RUN npm install -g most-recent-tarball.tgz

CMD ["/bin/sh", "container-cmd.sh"]