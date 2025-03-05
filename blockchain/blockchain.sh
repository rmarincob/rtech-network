#!/bin/bash

up() {
    echo "GENERATE NETWORK CREDENTIALS"
    cryptogen generate --config=./crypto-config.yaml
    echo "CREATE THE GENESIS BLOCK AND CHANNEL CONFIGURATION"
    echo  "GENERATE GENESIS BLOCK"
    configtxgen -profile RTechGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
    echo  "CREATE TX FOR CHANNEL"
    configtxgen -profile RTechMediledger -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID mediledger
    echo  "ANCHOR PEERS DEFINITION FOR EACH ORG"
    configtxgen -profile RTechMediledger -outputAnchorPeersUpdate ./channel-artifacts/doctorMSPAnchors.tx -channelID mediledger -asOrg doctorMSP
    configtxgen -profile RTechMediledger -outputAnchorPeersUpdate ./channel-artifacts/patientMSPAnchors.tx -channelID mediledger -asOrg patientMSP
    echo  "GENERATE CONTAINERS"
    docker compose -f docker-compose.yml --env-file ../.env.production up -d
}

down() {
    docker compose -f docker-compose.yml --env-file ../.env.production down -v
    rm -rf ./crypto-config
    rm -rf ./channel-artifacts/*
}

if [ "$1" == "up" ]; then
    up
elif [ "$1" == "down" ]; then
    down
fi