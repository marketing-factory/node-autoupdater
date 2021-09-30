# nodejs-autoupdater

<!--- TODO: Add description -->

## Prerequisite
- git
- npm >= 7.x
- Configured git user and email

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

### Using Docker

Pull the image from the container registry:
```console
docker pull ghcr.io/marketing-factory/nodejs-autoupdater:latest
```
And run: (Replacing `"$(pwd)"` with the absolute path to the root directory of your project)
```console
docker run --cap-add=SYS_ADMIN -v "$(pwd)":/app:ro ghcr.io/marketing-factory/nodejs-autoupdater:latest
```

## Configuration
...
<!--- TODO: Add config documentation -->

## Authentication

### Git

If no matching credentials are found in a `.netrc` file (`_netrc` on Windows), `nodejs-autoupdater`
will use the HTTP basic scheme ([RFC 7617](https://datatracker.ietf.org/doc/html/rfc7617)) to authenticate
git actions such as creating the autoupdate branch and pushing to it.
This relies on the presence of a username and a password in your configuration file (e. g. `gitlab_user_username`
and `gitlab_auth_token`).

### GitLab API

For private repositories with 2FA enabled, a value for `gitlab_auth_token` must be provided in a configuration
file.

<!--- 
docker build --tag autoupdater:latest .

docker run -it --rm --mount type=bind,source=$(pwd),target=/app --entrypoint /bin/sh autoupdater
-->