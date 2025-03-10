#!/bin/bash

up() {
    echo  "GENERATE EXPLORER CONTAINERS"
    docker compose -f docker-compose-explorer.yml --env-file ../.env.production up -d
}

down() {
    echo  "DOWN EXPLORER CONTAINERS"
    docker compose -f docker-compose-explorer.yml --env-file ../.env.production down -v
}

if [ "$1" == "up" ]; then
    up
elif [ "$1" == "down" ]; then
    down
fi