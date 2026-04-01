import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Step 1: Create enum types for the flights collection
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_flights_board_type" AS ENUM('arrival', 'departure');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_flights_status" AS ENUM('active', 'hidden');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_flights_remarks" AS ENUM('Scheduled', 'On Time', 'Delayed', 'Cancelled', 'Departed', 'En Route', 'Landed', 'Diverted', 'Boarding');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_flights_source" AS ENUM('manual', 'override');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)

  // Step 2: Create flights table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "flights" (
      "id" serial PRIMARY KEY NOT NULL,
      "board_type" "enum_flights_board_type" DEFAULT 'arrival' NOT NULL,
      "status" "enum_flights_status" DEFAULT 'active' NOT NULL,
      "airline" varchar NOT NULL,
      "flight_number" varchar NOT NULL,
      "route" varchar NOT NULL,
      "scheduled_time" timestamp(3) with time zone NOT NULL,
      "estimated_time" timestamp(3) with time zone,
      "remarks" "enum_flights_remarks" DEFAULT 'Scheduled' NOT NULL,
      "source" "enum_flights_source" DEFAULT 'manual' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "flights_updated_at_idx" ON "flights" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "flights_created_at_idx" ON "flights" USING btree ("created_at");
  `)

  // Step 3: Convert text/varchar body columns to jsonb (richText migration)
  // Clear plain text that isn't valid JSON, then alter type
  await db.execute(sql`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE (table_name, column_name) IN (
          ('notices_locales', 'body'),
          ('_notices_v_locales', 'version_body'),
          ('pages_sections', 'body'),
          ('_pages_v_version_sections', 'body'),
          ('news_events_locales', 'body'),
          ('_news_events_v_locales', 'version_body'),
          ('passenger_guide_sections', 'body'),
          ('transport_parking_sections', 'body'),
          ('accessibility_info_sections', 'body'),
          ('regulations_sections_locales', 'body'),
          ('_regulations_v_version_sections_locales', 'body'),
          ('legal_pages_locales', 'disclaimer_content'),
          ('legal_pages_locales', 'terms_of_use_content'),
          ('legal_pages_locales', 'privacy_policy_content'),
          ('legal_pages_locales', 'cookie_policy_content'),
          ('_legal_pages_v_locales', 'version_disclaimer_content'),
          ('_legal_pages_v_locales', 'version_terms_of_use_content'),
          ('_legal_pages_v_locales', 'version_privacy_policy_content'),
          ('_legal_pages_v_locales', 'version_cookie_policy_content')
        )
        AND data_type IN ('character varying', 'text')
        AND table_schema = 'public'
      LOOP
        -- Replace plain text with empty Lexical JSON structure
        EXECUTE format(
          'UPDATE %I SET %I = ''{"root":{"children":[],"direction":null,"format":"","indent":0,"type":"root","version":1}}'' WHERE %I IS NOT NULL AND left(%I, 1) NOT IN (''{'' , ''['')',
          r.table_name, r.column_name, r.column_name, r.column_name
        );
        EXECUTE format(
          'ALTER TABLE %I ALTER COLUMN %I SET DATA TYPE jsonb USING %I::jsonb',
          r.table_name, r.column_name, r.column_name
        );
      END LOOP;
    END $$;
  `)

  // Step 4: Add 'mfe' locale values
  await db.execute(sql`
    DO $$
    DECLARE
      enum_name TEXT;
      enum_names TEXT[] := ARRAY[
        '_locales',
        'enum__notices_v_published_locale',
        'enum__pages_v_published_locale',
        'enum__airlines_v_published_locale',
        'enum__news_events_v_published_locale',
        'enum__regulations_v_published_locale',
        'enum__usage_fees_v_published_locale',
        'enum__vip_lounge_v_published_locale',
        'enum__emergency_services_v_published_locale',
        'enum__working_hours_directions_v_published_locale',
        'enum__useful_links_v_published_locale',
        'enum__management_staff_v_published_locale',
        'enum__legal_pages_v_published_locale'
      ];
    BEGIN
      FOREACH enum_name IN ARRAY enum_names LOOP
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = enum_name AND e.enumlabel = 'mfe'
        ) THEN
          EXECUTE format('ALTER TYPE "public".%I ADD VALUE ''mfe''', enum_name);
        END IF;
      END LOOP;
    END $$;
  `)

  // Step 5: Add flights_id to locked documents rels
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "flights_id" integer;
    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_flights_fk"
        FOREIGN KEY ("flights_id") REFERENCES "public"."flights"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_flights_id_idx"
      ON "payload_locked_documents_rels" USING btree ("flights_id");
  `)

  // Step 6: Pages image column
  await db.execute(sql`
    ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "page_image_id" integer;
    ALTER TABLE "_pages_v" ADD COLUMN IF NOT EXISTS "version_page_image_id" integer;
    DO $$ BEGIN
      ALTER TABLE "pages"
        ADD CONSTRAINT "pages_page_image_id_media_id_fk"
        FOREIGN KEY ("page_image_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    DO $$ BEGIN
      ALTER TABLE "_pages_v"
        ADD CONSTRAINT "_pages_v_version_page_image_id_media_id_fk"
        FOREIGN KEY ("version_page_image_id") REFERENCES "public"."media"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "pages_page_image_idx" ON "pages" USING btree ("page_image_id");
    CREATE INDEX IF NOT EXISTS "_pages_v_version_version_page_image_idx" ON "_pages_v" USING btree ("version_page_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "flights" DISABLE ROW LEVEL SECURITY;
    DROP TABLE IF EXISTS "flights" CASCADE;
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "flights_id";
    ALTER TABLE "pages" DROP COLUMN IF EXISTS "page_image_id";
    ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "version_page_image_id";
    DROP TYPE IF EXISTS "public"."enum_flights_board_type";
    DROP TYPE IF EXISTS "public"."enum_flights_status";
    DROP TYPE IF EXISTS "public"."enum_flights_remarks";
    DROP TYPE IF EXISTS "public"."enum_flights_source";
  `)
}
