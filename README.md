# Autopilot Pattern Postgres

This repo serves as a blueprint demonstrating [Postgres](https://www.postgresql.org/) designed for automated operation using the [Autopilot Pattern](http://autopilotpattern.io/).

[![DockerPulls](https://img.shields.io/docker/pulls/autopilotpattern/postgres.svg)](https://registry.hub.docker.com/u/autopilotpattern/postgres/)
[![DockerStars](https://img.shields.io/docker/stars/autopilotpattern/postgres.svg)](https://registry.hub.docker.com/u/autopilotpattern/postgres/)

## Environment Variables

- `CONSUL`: consul hostname
- `CONSUL_AGENT`: determines if the consul agent is executed in the container
- `DEBUG`: used to control the Node.js `debug` module
- `LOG_LEVEL`: control the amount of logging from ContainerPilot
- `PGDATA`: sets the location of the Postgres database files
- `POSTGRES_DB`: the name of the Postgres database
- `POSTGRES_PASSWORD`: the password used to access the Postgres database
- `POSTGRES_USER`: the username used to access the Postgres database

## Example Usage

```
$ cd examples/compose
$ docker-compose up -d
$ docker-compose scale db=3
```

The first instance creates a Postgres master. All additional instances create read-only replicas.

## Modifying this Pattern

This image extends the [official `postgres:9.6.4-alpine` image](https://hub.docker.com/_/postgres/). Postgres can be configured as needed by modifying `etc/pg_hba.conf`, `etc/postgresql.conf.ctmpl`, and `etc/recovery.conf.ctmpl`, and then rebuilding the image.
