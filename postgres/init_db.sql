CREATE TABLE "public"."users" (
  "id" bigserial,
  "key" varchar(255) UNIQUE NOT NULL,
  "document" varchar(255) UNIQUE NOT NULL,
  "secret_key" varchar(255) UNIQUE NOT NULL,
  "iv" varchar(255) UNIQUE NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);