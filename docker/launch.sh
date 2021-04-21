#!/bin/bash

POSTGRES_DIRECTORY="$(pwd)/postgres_data";

if [ ! -d "$POSTGRES_DIRECTORY" ]; then
    mkdir -p $POSTGRES_DIRECTORY;
fi

if [ -z `docker-compose ps -q id-generation-service-postgres` ] || [ -z `docker ps -q --no-trunc | grep $(docker-compose ps -q id-generation-service-postgres)` ]; then
    docker-compose -p cqdg-keycloak up -d; # --remove-orphans;
    sleep 2;
fi
