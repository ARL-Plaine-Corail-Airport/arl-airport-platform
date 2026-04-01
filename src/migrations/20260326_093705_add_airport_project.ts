import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_airport_project_category" AS ENUM('notice_to_bidders', 'press_release', 'site_visit', 'environmental', 'general');
  CREATE TYPE "public"."enum_airport_project_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__airport_project_v_version_category" AS ENUM('notice_to_bidders', 'press_release', 'site_visit', 'environmental', 'general');
  CREATE TYPE "public"."enum__airport_project_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__airport_project_v_published_locale" AS ENUM('en', 'fr', 'mfe');
  CREATE TABLE "airport_project_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer
  );
  
  CREATE TABLE "airport_project_attachments_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "airport_project" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"category" "enum_airport_project_category",
  	"featured_image_id" integer,
  	"status" "enum_airport_project_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"is_pinned" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_airport_project_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "airport_project_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"body" jsonb,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_airport_project_v_version_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"file_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_airport_project_v_version_attachments_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_airport_project_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_category" "enum__airport_project_v_version_category",
  	"version_featured_image_id" integer,
  	"version_status" "enum__airport_project_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_is_pinned" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__airport_project_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__airport_project_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_airport_project_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_body" jsonb,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "airport_project_id" integer;
  ALTER TABLE "airport_project_attachments" ADD CONSTRAINT "airport_project_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "airport_project_attachments" ADD CONSTRAINT "airport_project_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."airport_project"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "airport_project_attachments_locales" ADD CONSTRAINT "airport_project_attachments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."airport_project_attachments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "airport_project" ADD CONSTRAINT "airport_project_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "airport_project_locales" ADD CONSTRAINT "airport_project_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."airport_project"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_airport_project_v_version_attachments" ADD CONSTRAINT "_airport_project_v_version_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_airport_project_v_version_attachments" ADD CONSTRAINT "_airport_project_v_version_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_airport_project_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_airport_project_v_version_attachments_locales" ADD CONSTRAINT "_airport_project_v_version_attachments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_airport_project_v_version_attachments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_airport_project_v" ADD CONSTRAINT "_airport_project_v_parent_id_airport_project_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."airport_project"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_airport_project_v" ADD CONSTRAINT "_airport_project_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_airport_project_v_locales" ADD CONSTRAINT "_airport_project_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_airport_project_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "airport_project_attachments_order_idx" ON "airport_project_attachments" USING btree ("_order");
  CREATE INDEX "airport_project_attachments_parent_id_idx" ON "airport_project_attachments" USING btree ("_parent_id");
  CREATE INDEX "airport_project_attachments_file_idx" ON "airport_project_attachments" USING btree ("file_id");
  CREATE UNIQUE INDEX "airport_project_attachments_locales_locale_parent_id_unique" ON "airport_project_attachments_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "airport_project_slug_idx" ON "airport_project" USING btree ("slug");
  CREATE INDEX "airport_project_featured_image_idx" ON "airport_project" USING btree ("featured_image_id");
  CREATE INDEX "airport_project_updated_at_idx" ON "airport_project" USING btree ("updated_at");
  CREATE INDEX "airport_project_created_at_idx" ON "airport_project" USING btree ("created_at");
  CREATE INDEX "airport_project__status_idx" ON "airport_project" USING btree ("_status");
  CREATE UNIQUE INDEX "airport_project_locales_locale_parent_id_unique" ON "airport_project_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_airport_project_v_version_attachments_order_idx" ON "_airport_project_v_version_attachments" USING btree ("_order");
  CREATE INDEX "_airport_project_v_version_attachments_parent_id_idx" ON "_airport_project_v_version_attachments" USING btree ("_parent_id");
  CREATE INDEX "_airport_project_v_version_attachments_file_idx" ON "_airport_project_v_version_attachments" USING btree ("file_id");
  CREATE UNIQUE INDEX "_airport_project_v_version_attachments_locales_locale_parent" ON "_airport_project_v_version_attachments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_airport_project_v_parent_idx" ON "_airport_project_v" USING btree ("parent_id");
  CREATE INDEX "_airport_project_v_version_version_slug_idx" ON "_airport_project_v" USING btree ("version_slug");
  CREATE INDEX "_airport_project_v_version_version_featured_image_idx" ON "_airport_project_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_airport_project_v_version_version_updated_at_idx" ON "_airport_project_v" USING btree ("version_updated_at");
  CREATE INDEX "_airport_project_v_version_version_created_at_idx" ON "_airport_project_v" USING btree ("version_created_at");
  CREATE INDEX "_airport_project_v_version_version__status_idx" ON "_airport_project_v" USING btree ("version__status");
  CREATE INDEX "_airport_project_v_created_at_idx" ON "_airport_project_v" USING btree ("created_at");
  CREATE INDEX "_airport_project_v_updated_at_idx" ON "_airport_project_v" USING btree ("updated_at");
  CREATE INDEX "_airport_project_v_snapshot_idx" ON "_airport_project_v" USING btree ("snapshot");
  CREATE INDEX "_airport_project_v_published_locale_idx" ON "_airport_project_v" USING btree ("published_locale");
  CREATE INDEX "_airport_project_v_latest_idx" ON "_airport_project_v" USING btree ("latest");
  CREATE INDEX "_airport_project_v_autosave_idx" ON "_airport_project_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_airport_project_v_locales_locale_parent_id_unique" ON "_airport_project_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_airport_project_fk" FOREIGN KEY ("airport_project_id") REFERENCES "public"."airport_project"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_airport_project_id_idx" ON "payload_locked_documents_rels" USING btree ("airport_project_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "airport_project_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "airport_project_attachments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "airport_project" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "airport_project_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_airport_project_v_version_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_airport_project_v_version_attachments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_airport_project_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_airport_project_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "airport_project_attachments" CASCADE;
  DROP TABLE "airport_project_attachments_locales" CASCADE;
  DROP TABLE "airport_project" CASCADE;
  DROP TABLE "airport_project_locales" CASCADE;
  DROP TABLE "_airport_project_v_version_attachments" CASCADE;
  DROP TABLE "_airport_project_v_version_attachments_locales" CASCADE;
  DROP TABLE "_airport_project_v" CASCADE;
  DROP TABLE "_airport_project_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_airport_project_fk";
  
  DROP INDEX "payload_locked_documents_rels_airport_project_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "airport_project_id";
  DROP TYPE "public"."enum_airport_project_category";
  DROP TYPE "public"."enum_airport_project_status";
  DROP TYPE "public"."enum__airport_project_v_version_category";
  DROP TYPE "public"."enum__airport_project_v_version_status";
  DROP TYPE "public"."enum__airport_project_v_published_locale";`)
}
