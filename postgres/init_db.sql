CREATE TABLE "public"."users" (
  "id" bigserial,
  "document" varchar(255) UNIQUE NOT NULL,
  "hyperledger_key" varchar(255) UNIQUE NOT NULL,
  "secret_key" varchar(255) UNIQUE NOT NULL,
  "iv" varchar(255) UNIQUE NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);