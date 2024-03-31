---
title: Installing threatcl
---

## Direct download

Download the latest version from [releases](https://github.com/threatcl/threatcl/releases) and move the `threatcl` binary into your PATH.

## Homebrew

The following will add a local tap, and install `threatcl` with [Homebrew](https://brew.sh/)

```bash title="terminal"
brew install threatcl/repo/threatcl
```

## Run with Docker

```bash title="terminal"
docker run --rm -it ghcr.io/threatcl/threatcl:latest
```

> \* Don't forget you may need to map volumes with `-v` to interact with files

## Run with GitHub Actions

`threatcl` can be integrated into your GitHub repos with https://github.com/threatcl/threatcl-action. This is one of the ideal methods to manage your threat models, and helps meet the goal of integrating into your version control systems.

## Install with go

```bash title="terminal"
go install github.com/threatcl/threatcl/cmd/threatcl@latest
```

## Building from Source

The source is available: https://github.com/threatcl/threatcl

```bash title="terminal"
git clone https://github.com/threatcl/threatcl
cd threatcl
make bootstrap
make build
```
