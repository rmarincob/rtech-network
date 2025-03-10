#!/bin/bash

up() {
    echo  "GENERATE API REST CONTAINERS"
    docker compose -f docker-compose-apirest.yml up -d
}

down() {
    echo  "DOWN API REST CONTAINERS"
    docker compose -f docker-compose-apirest.yml down -v
}

if [ "$1" == "up" ]; then
    up
elif [ "$1" == "down" ]; then
    down
fi