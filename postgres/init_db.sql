CREATE TABLE "public"."users" (
  "id" bigserial,
  "document" varchar(255) UNIQUE NOT NULL,
  "key_generate" varchar(255) NOT NULL,
  "created_at" varchar(255) NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("id")
);