# nodejs-autoupdater

<!--- TODO: Add description -->

## Prerequisite
- git
- npm >= v7.x
- Configure git user and email

Note that this package provides a docker image containing the CLI and everything it needs (see below).

## Installation and Usage

### Using npm
Install `nodejs-autoupdater` globally via `npm`:
```console
npm install -g nodejs-autoupdater
```
Then use its bin called `autoupdate` with the root directory of your project:
```console
autoupdate <project-root>
```

### Docker image
Pull the image from the container registry:
```console
docker pull ghcr.io/marketing-factory/nodejs-autoupdater:latest
```
And run:
```console
docker run --rm --mount type=bind,source=$(pwd),target=/user-project nodejs-autoupdater:latest
```

<!--- TODO: Add config documentation -->

<!--- 
docker build --tag autoupdater:latest .

docker run -it --rm --mount type=bind,source=$(pwd),target=/user-project --entrypoint /bin/sh autoupdater
-->