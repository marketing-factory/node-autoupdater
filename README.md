# nodejs-autoupdater

<!--- TODO: Add description -->

## Installation and Usage

<br />

### Using npm
Install `nodejs-autoupdater` globally via `npm`:
```console
npm install -g nodejs-autoupdater
```
Then use its bin called `autoupdate` with the root directory of your project:
```console
autoupdate <project-root>
```
This method requires git to be installed on your machine.

<br />

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
docker build --build-arg TARBALL_PATH=nodejs-autoupdater-0.0.4.tgz --tag autoupdater:latest .

docker run -it --rm --mount type=bind,source=$(pwd),target=/user-project --entrypoint /bin/sh autoupdater
-->