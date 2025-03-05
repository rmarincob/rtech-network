CREATE TABLE "public"."users" (
  "id" bigserial,
  "document" varchar(255) UNIQUE NOT NULL,
  "encryption_key" varchar(255) UNIQUE NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);