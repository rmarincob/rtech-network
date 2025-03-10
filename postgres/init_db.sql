CREATE DATABASE security
WITH
  OWNER = 'postgres'
  ENCODING = 'UTF8'
;

\c security;

CREATE SCHEMA IF NOT EXISTS keycloak AUTHORIZATION postgres;
GRANT ALL ON SCHEMA keycloak TO postgres;

CREATE SCHEMA IF NOT EXISTS hyperledger AUTHORIZATION postgres;
GRANT ALL ON SCHEMA hyperledger TO postgres;

CREATE TABLE "hyperledger"."users" (
  "id" BIGSERIAL,
  "document" VARCHAR(255) UNIQUE NOT NULL,
  "hyperledger_key" VARCHAR(255) UNIQUE NOT NULL,
  "secret_key" VARCHAR(255) UNIQUE NOT NULL,
  "iv" VARCHAR(255) UNIQUE NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);