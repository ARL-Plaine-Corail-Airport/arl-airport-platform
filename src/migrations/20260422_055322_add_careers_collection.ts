import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum__flights_v_version_board_type" AS ENUM('arrival', 'departure');
  CREATE TYPE "public"."enum__flights_v_version_status" AS ENUM('active', 'hidden');
  CREATE TYPE "public"."enum__flights_v_version_remarks" AS ENUM('Scheduled', 'On Time', 'Delayed', 'Cancelled', 'Departed', 'En Route', 'Landed', 'Diverted', 'Boarding');
  CREATE TYPE "public"."enum__flights_v_version_source" AS ENUM('manual', 'override');
  CREATE TYPE "public"."enum_careers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__careers_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__careers_v_published_locale" AS ENUM('en', 'fr', 'mfe');
  CREATE TABLE "_flights_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_board_type" "enum__flights_v_version_board_type" DEFAULT 'arrival' NOT NULL,
  	"version_status" "enum__flights_v_version_status" DEFAULT 'active' NOT NULL,
  	"version_airline" varchar NOT NULL,
  	"version_flight_number" varchar NOT NULL,
  	"version_route" varchar NOT NULL,
  	"version_scheduled_time" timestamp(3) with time zone NOT NULL,
  	"version_estimated_time" timestamp(3) with time zone,
  	"version_remarks" "enum__flights_v_version_remarks" DEFAULT 'Scheduled' NOT NULL,
  	"version_source" "enum__flights_v_version_source" DEFAULT 'manual' NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "careers_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer
  );
  
  CREATE TABLE "careers_attachments_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "careers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"status" "enum_careers_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"last_approved_by_id" integer,
  	"is_pinned" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_careers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "careers_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_careers_v_version_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"file_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_careers_v_version_attachments_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_careers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_status" "enum__careers_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_last_approved_by_id" integer,
  	"version_is_pinned" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__careers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__careers_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_careers_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "airport_map_points_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regulations_approval_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"approved_by_id" integer,
  	"approved_at" timestamp(3) with time zone,
  	"notes" varchar
  );
  
  CREATE TABLE "_regulations_v_version_approval_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"approved_by_id" integer,
  	"approved_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "legal_pages_approval_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"approved_by_id" integer,
  	"approved_at" timestamp(3) with time zone,
  	"notes" varchar
  );
  
  CREATE TABLE "_legal_pages_v_version_approval_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"approved_by_id" integer,
  	"approved_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "faqs" ALTER COLUMN "category" SET NOT NULL;
  ALTER TABLE "faqs" ALTER COLUMN "status" SET DEFAULT 'draft';
  ALTER TABLE "news_events" ADD COLUMN "last_approved_by_id" integer;
  ALTER TABLE "_news_events_v" ADD COLUMN "version_last_approved_by_id" integer;
  ALTER TABLE "airport_project" ADD COLUMN "last_approved_by_id" integer;
  ALTER TABLE "_airport_project_v" ADD COLUMN "version_last_approved_by_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "careers_id" integer;
  ALTER TABLE "regulations" ADD COLUMN "approval_notes" varchar;
  ALTER TABLE "_regulations_v" ADD COLUMN "version_approval_notes" varchar;
  ALTER TABLE "emergency_services" ADD COLUMN "status" "enum_emergency_services_status" DEFAULT 'draft';
  ALTER TABLE "_emergency_services_v" ADD COLUMN "version_status" "enum__emergency_services_v_version_status" DEFAULT 'draft';
  ALTER TABLE "legal_pages" ADD COLUMN "approval_notes" varchar;
  ALTER TABLE "_legal_pages_v" ADD COLUMN "version_approval_notes" varchar;
  ALTER TABLE "_flights_v" ADD CONSTRAINT "_flights_v_parent_id_flights_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."flights"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "careers_attachments" ADD CONSTRAINT "careers_attachments_file_id_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "careers_attachments" ADD CONSTRAINT "careers_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."careers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "careers_attachments_locales" ADD CONSTRAINT "careers_attachments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."careers_attachments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "careers" ADD CONSTRAINT "careers_last_approved_by_id_users_id_fk" FOREIGN KEY ("last_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "careers_locales" ADD CONSTRAINT "careers_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."careers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_careers_v_version_attachments" ADD CONSTRAINT "_careers_v_version_attachments_file_id_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_careers_v_version_attachments" ADD CONSTRAINT "_careers_v_version_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_careers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_careers_v_version_attachments_locales" ADD CONSTRAINT "_careers_v_version_attachments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_careers_v_version_attachments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_careers_v" ADD CONSTRAINT "_careers_v_parent_id_careers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."careers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_careers_v" ADD CONSTRAINT "_careers_v_version_last_approved_by_id_users_id_fk" FOREIGN KEY ("version_last_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_careers_v_locales" ADD CONSTRAINT "_careers_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_careers_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "airport_map_points_locales" ADD CONSTRAINT "airport_map_points_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."airport_map_points"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regulations_approval_history" ADD CONSTRAINT "regulations_approval_history_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regulations_approval_history" ADD CONSTRAINT "regulations_approval_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regulations_v_version_approval_history" ADD CONSTRAINT "_regulations_v_version_approval_history_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regulations_v_version_approval_history" ADD CONSTRAINT "_regulations_v_version_approval_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regulations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "legal_pages_approval_history" ADD CONSTRAINT "legal_pages_approval_history_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "legal_pages_approval_history" ADD CONSTRAINT "legal_pages_approval_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_legal_pages_v_version_approval_history" ADD CONSTRAINT "_legal_pages_v_version_approval_history_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_legal_pages_v_version_approval_history" ADD CONSTRAINT "_legal_pages_v_version_approval_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_legal_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_flights_v_parent_idx" ON "_flights_v" USING btree ("parent_id");
  CREATE INDEX "_flights_v_version_version_updated_at_idx" ON "_flights_v" USING btree ("version_updated_at");
  CREATE INDEX "_flights_v_version_version_created_at_idx" ON "_flights_v" USING btree ("version_created_at");
  CREATE INDEX "_flights_v_created_at_idx" ON "_flights_v" USING btree ("created_at");
  CREATE INDEX "_flights_v_updated_at_idx" ON "_flights_v" USING btree ("updated_at");
  CREATE INDEX "careers_attachments_order_idx" ON "careers_attachments" USING btree ("_order");
  CREATE INDEX "careers_attachments_parent_id_idx" ON "careers_attachments" USING btree ("_parent_id");
  CREATE INDEX "careers_attachments_file_idx" ON "careers_attachments" USING btree ("file_id");
  CREATE UNIQUE INDEX "careers_attachments_locales_locale_parent_id_unique" ON "careers_attachments_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "careers_slug_idx" ON "careers" USING btree ("slug");
  CREATE INDEX "careers_last_approved_by_idx" ON "careers" USING btree ("last_approved_by_id");
  CREATE INDEX "careers_updated_at_idx" ON "careers" USING btree ("updated_at");
  CREATE INDEX "careers_created_at_idx" ON "careers" USING btree ("created_at");
  CREATE INDEX "careers__status_idx" ON "careers" USING btree ("_status");
  CREATE UNIQUE INDEX "careers_locales_locale_parent_id_unique" ON "careers_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_careers_v_version_attachments_order_idx" ON "_careers_v_version_attachments" USING btree ("_order");
  CREATE INDEX "_careers_v_version_attachments_parent_id_idx" ON "_careers_v_version_attachments" USING btree ("_parent_id");
  CREATE INDEX "_careers_v_version_attachments_file_idx" ON "_careers_v_version_attachments" USING btree ("file_id");
  CREATE UNIQUE INDEX "_careers_v_version_attachments_locales_locale_parent_id_uniq" ON "_careers_v_version_attachments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_careers_v_parent_idx" ON "_careers_v" USING btree ("parent_id");
  CREATE INDEX "_careers_v_version_version_slug_idx" ON "_careers_v" USING btree ("version_slug");
  CREATE INDEX "_careers_v_version_version_last_approved_by_idx" ON "_careers_v" USING btree ("version_last_approved_by_id");
  CREATE INDEX "_careers_v_version_version_updated_at_idx" ON "_careers_v" USING btree ("version_updated_at");
  CREATE INDEX "_careers_v_version_version_created_at_idx" ON "_careers_v" USING btree ("version_created_at");
  CREATE INDEX "_careers_v_version_version__status_idx" ON "_careers_v" USING btree ("version__status");
  CREATE INDEX "_careers_v_created_at_idx" ON "_careers_v" USING btree ("created_at");
  CREATE INDEX "_careers_v_updated_at_idx" ON "_careers_v" USING btree ("updated_at");
  CREATE INDEX "_careers_v_snapshot_idx" ON "_careers_v" USING btree ("snapshot");
  CREATE INDEX "_careers_v_published_locale_idx" ON "_careers_v" USING btree ("published_locale");
  CREATE INDEX "_careers_v_latest_idx" ON "_careers_v" USING btree ("latest");
  CREATE INDEX "_careers_v_autosave_idx" ON "_careers_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_careers_v_locales_locale_parent_id_unique" ON "_careers_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "airport_map_points_locales_locale_parent_id_unique" ON "airport_map_points_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regulations_approval_history_order_idx" ON "regulations_approval_history" USING btree ("_order");
  CREATE INDEX "regulations_approval_history_parent_id_idx" ON "regulations_approval_history" USING btree ("_parent_id");
  CREATE INDEX "regulations_approval_history_approved_by_idx" ON "regulations_approval_history" USING btree ("approved_by_id");
  CREATE INDEX "_regulations_v_version_approval_history_order_idx" ON "_regulations_v_version_approval_history" USING btree ("_order");
  CREATE INDEX "_regulations_v_version_approval_history_parent_id_idx" ON "_regulations_v_version_approval_history" USING btree ("_parent_id");
  CREATE INDEX "_regulations_v_version_approval_history_approved_by_idx" ON "_regulations_v_version_approval_history" USING btree ("approved_by_id");
  CREATE INDEX "legal_pages_approval_history_order_idx" ON "legal_pages_approval_history" USING btree ("_order");
  CREATE INDEX "legal_pages_approval_history_parent_id_idx" ON "legal_pages_approval_history" USING btree ("_parent_id");
  CREATE INDEX "legal_pages_approval_history_approved_by_idx" ON "legal_pages_approval_history" USING btree ("approved_by_id");
  CREATE INDEX "_legal_pages_v_version_approval_history_order_idx" ON "_legal_pages_v_version_approval_history" USING btree ("_order");
  CREATE INDEX "_legal_pages_v_version_approval_history_parent_id_idx" ON "_legal_pages_v_version_approval_history" USING btree ("_parent_id");
  CREATE INDEX "_legal_pages_v_version_approval_history_approved_by_idx" ON "_legal_pages_v_version_approval_history" USING btree ("approved_by_id");
  ALTER TABLE "news_events" ADD CONSTRAINT "news_events_last_approved_by_id_users_id_fk" FOREIGN KEY ("last_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_events_v" ADD CONSTRAINT "_news_events_v_version_last_approved_by_id_users_id_fk" FOREIGN KEY ("version_last_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "airport_project" ADD CONSTRAINT "airport_project_last_approved_by_id_users_id_fk" FOREIGN KEY ("last_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_airport_project_v" ADD CONSTRAINT "_airport_project_v_version_last_approved_by_id_users_id_fk" FOREIGN KEY ("version_last_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_careers_fk" FOREIGN KEY ("careers_id") REFERENCES "public"."careers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "notices_category_idx" ON "notices" USING btree ("category");
  CREATE INDEX "notices_status_idx" ON "notices" USING btree ("status");
  CREATE INDEX "_notices_v_version_version_category_idx" ON "_notices_v" USING btree ("version_category");
  CREATE INDEX "_notices_v_version_version_status_idx" ON "_notices_v" USING btree ("version_status");
  CREATE INDEX "pages_status_idx" ON "pages" USING btree ("status");
  CREATE INDEX "_pages_v_version_version_status_idx" ON "_pages_v" USING btree ("version_status");
  CREATE INDEX "airlines_is_active_idx" ON "airlines" USING btree ("is_active");
  CREATE INDEX "airlines_iata_code_idx" ON "airlines" USING btree ("iata_code");
  CREATE INDEX "_airlines_v_version_version_is_active_idx" ON "_airlines_v" USING btree ("version_is_active");
  CREATE INDEX "_airlines_v_version_version_iata_code_idx" ON "_airlines_v" USING btree ("version_iata_code");
  CREATE INDEX "news_events_last_approved_by_idx" ON "news_events" USING btree ("last_approved_by_id");
  CREATE INDEX "_news_events_v_version_version_last_approved_by_idx" ON "_news_events_v" USING btree ("version_last_approved_by_id");
  CREATE INDEX "airport_project_last_approved_by_idx" ON "airport_project" USING btree ("last_approved_by_id");
  CREATE INDEX "_airport_project_v_version_version_last_approved_by_idx" ON "_airport_project_v" USING btree ("version_last_approved_by_id");
  CREATE INDEX "payload_locked_documents_rels_careers_id_idx" ON "payload_locked_documents_rels" USING btree ("careers_id");
  INSERT INTO "airport_map_points_locales" ("name", "description", "_locale", "_parent_id")
  SELECT
    COALESCE("name", ''),
    COALESCE("description", ''),
    'en'::"_locales",
    "id"
  FROM "airport_map_points"
  WHERE "name" IS NOT NULL OR "description" IS NOT NULL;
  ALTER TABLE "airport_map_points" DROP COLUMN "name";
  ALTER TABLE "airport_map_points" DROP COLUMN "description";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_flights_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "careers_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "careers_attachments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "careers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "careers_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_careers_v_version_attachments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_careers_v_version_attachments_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_careers_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_careers_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "airport_map_points_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "regulations_approval_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_regulations_v_version_approval_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "legal_pages_approval_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_legal_pages_v_version_approval_history" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_flights_v" CASCADE;
  DROP TABLE "careers_attachments" CASCADE;
  DROP TABLE "careers_attachments_locales" CASCADE;
  DROP TABLE "careers" CASCADE;
  DROP TABLE "careers_locales" CASCADE;
  DROP TABLE "_careers_v_version_attachments" CASCADE;
  DROP TABLE "_careers_v_version_attachments_locales" CASCADE;
  DROP TABLE "_careers_v" CASCADE;
  DROP TABLE "_careers_v_locales" CASCADE;
  DROP TABLE "airport_map_points_locales" CASCADE;
  DROP TABLE "regulations_approval_history" CASCADE;
  DROP TABLE "_regulations_v_version_approval_history" CASCADE;
  DROP TABLE "legal_pages_approval_history" CASCADE;
  DROP TABLE "_legal_pages_v_version_approval_history" CASCADE;
  ALTER TABLE "news_events" DROP CONSTRAINT "news_events_last_approved_by_id_users_id_fk";
  
  ALTER TABLE "_news_events_v" DROP CONSTRAINT "_news_events_v_version_last_approved_by_id_users_id_fk";
  
  ALTER TABLE "airport_project" DROP CONSTRAINT "airport_project_last_approved_by_id_users_id_fk";
  
  ALTER TABLE "_airport_project_v" DROP CONSTRAINT "_airport_project_v_version_last_approved_by_id_users_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_careers_fk";
  
  DROP INDEX "notices_category_idx";
  DROP INDEX "notices_status_idx";
  DROP INDEX "_notices_v_version_version_category_idx";
  DROP INDEX "_notices_v_version_version_status_idx";
  DROP INDEX "pages_status_idx";
  DROP INDEX "_pages_v_version_version_status_idx";
  DROP INDEX "airlines_is_active_idx";
  DROP INDEX "airlines_iata_code_idx";
  DROP INDEX "_airlines_v_version_version_is_active_idx";
  DROP INDEX "_airlines_v_version_version_iata_code_idx";
  DROP INDEX "news_events_last_approved_by_idx";
  DROP INDEX "_news_events_v_version_version_last_approved_by_idx";
  DROP INDEX "airport_project_last_approved_by_idx";
  DROP INDEX "_airport_project_v_version_version_last_approved_by_idx";
  DROP INDEX "payload_locked_documents_rels_careers_id_idx";
  ALTER TABLE "faqs" ALTER COLUMN "category" DROP NOT NULL;
  ALTER TABLE "faqs" ALTER COLUMN "status" SET DEFAULT 'published';
  ALTER TABLE "airport_map_points" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "airport_map_points" ADD COLUMN "description" varchar NOT NULL;
  ALTER TABLE "news_events" DROP COLUMN "last_approved_by_id";
  ALTER TABLE "_news_events_v" DROP COLUMN "version_last_approved_by_id";
  ALTER TABLE "airport_project" DROP COLUMN "last_approved_by_id";
  ALTER TABLE "_airport_project_v" DROP COLUMN "version_last_approved_by_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "careers_id";
  ALTER TABLE "regulations" DROP COLUMN "approval_notes";
  ALTER TABLE "_regulations_v" DROP COLUMN "version_approval_notes";
  ALTER TABLE "emergency_services" DROP COLUMN "status";
  ALTER TABLE "_emergency_services_v" DROP COLUMN "version_status";
  ALTER TABLE "legal_pages" DROP COLUMN "approval_notes";
  ALTER TABLE "_legal_pages_v" DROP COLUMN "version_approval_notes";
  DROP TYPE "public"."enum__flights_v_version_board_type";
  DROP TYPE "public"."enum__flights_v_version_status";
  DROP TYPE "public"."enum__flights_v_version_remarks";
  DROP TYPE "public"."enum__flights_v_version_source";
  DROP TYPE "public"."enum_careers_status";
  DROP TYPE "public"."enum__careers_v_version_status";
  DROP TYPE "public"."enum__careers_v_published_locale";`)
}
