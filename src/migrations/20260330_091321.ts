import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "seo_default_description" SET DEFAULT 'Official mobile-first platform for Plaine Corail Airport arrivals, departures, communiques, passenger guidance, accessibility, transport, and airport contact information.';
  ALTER TABLE "notices_locales" ADD COLUMN IF NOT EXISTS "seo_meta_title" varchar;
  ALTER TABLE "notices_locales" ADD COLUMN IF NOT EXISTS "seo_meta_description" varchar;
  ALTER TABLE "_notices_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_meta_title" varchar;
  ALTER TABLE "_notices_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_meta_description" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN IF NOT EXISTS "seo_meta_title" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN IF NOT EXISTS "seo_meta_description" varchar;
  ALTER TABLE "_pages_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_meta_title" varchar;
  ALTER TABLE "_pages_v_locales" ADD COLUMN IF NOT EXISTS "version_seo_meta_description" varchar;
  ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "default_og_image_id" integer;
  DO $$ BEGIN
    ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_og_image_id_media_id_fk" FOREIGN KEY ("default_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$;
  CREATE INDEX IF NOT EXISTS "site_settings_default_og_image_idx" ON "site_settings" USING btree ("default_og_image_id");
  ALTER TABLE "pages_locales" DROP COLUMN IF EXISTS "seo_title";
  ALTER TABLE "pages_locales" DROP COLUMN IF EXISTS "seo_description";
  ALTER TABLE "_pages_v_locales" DROP COLUMN IF EXISTS "version_seo_title";
  ALTER TABLE "_pages_v_locales" DROP COLUMN IF EXISTS "version_seo_description";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_locales" RENAME COLUMN "seo_meta_title" TO "seo_title";
  ALTER TABLE "pages_locales" RENAME COLUMN "seo_meta_description" TO "seo_description";
  ALTER TABLE "_pages_v_locales" RENAME COLUMN "version_seo_meta_title" TO "version_seo_title";
  ALTER TABLE "_pages_v_locales" RENAME COLUMN "version_seo_meta_description" TO "version_seo_description";
  ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_default_og_image_id_media_id_fk";

  DROP INDEX IF EXISTS "site_settings_default_og_image_idx";
  ALTER TABLE "site_settings" ALTER COLUMN "seo_default_description" SET DEFAULT 'Official mobile-first platform for Plaine Corail Airport arrivals, departures, communiqués, passenger guidance, accessibility, transport, and airport contact information.';
  ALTER TABLE "notices_locales" DROP COLUMN IF EXISTS "seo_meta_title";
  ALTER TABLE "notices_locales" DROP COLUMN IF EXISTS "seo_meta_description";
  ALTER TABLE "_notices_v_locales" DROP COLUMN IF EXISTS "version_seo_meta_title";
  ALTER TABLE "_notices_v_locales" DROP COLUMN IF EXISTS "version_seo_meta_description";
  ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "default_og_image_id";`)
}
