import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "notices_locales"
      ADD COLUMN IF NOT EXISTS "seo_meta_title" varchar,
      ADD COLUMN IF NOT EXISTS "seo_meta_description" varchar;

    ALTER TABLE "_notices_v_locales"
      ADD COLUMN IF NOT EXISTS "version_seo_meta_title" varchar,
      ADD COLUMN IF NOT EXISTS "version_seo_meta_description" varchar;

    ALTER TABLE "pages_locales"
      ADD COLUMN IF NOT EXISTS "seo_meta_title" varchar,
      ADD COLUMN IF NOT EXISTS "seo_meta_description" varchar;

    ALTER TABLE "_pages_v_locales"
      ADD COLUMN IF NOT EXISTS "version_seo_meta_title" varchar,
      ADD COLUMN IF NOT EXISTS "version_seo_meta_description" varchar;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'pages_locales'
          AND column_name = 'seo_title'
      ) THEN
        UPDATE "pages_locales"
        SET
          "seo_meta_title" = COALESCE("seo_meta_title", "seo_title"),
          "seo_meta_description" = COALESCE("seo_meta_description", "seo_description");
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = '_pages_v_locales'
          AND column_name = 'version_seo_title'
      ) THEN
        UPDATE "_pages_v_locales"
        SET
          "version_seo_meta_title" = COALESCE("version_seo_meta_title", "version_seo_title"),
          "version_seo_meta_description" = COALESCE("version_seo_meta_description", "version_seo_description");
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "notices_locales"
      DROP COLUMN IF EXISTS "seo_meta_title",
      DROP COLUMN IF EXISTS "seo_meta_description";

    ALTER TABLE "_notices_v_locales"
      DROP COLUMN IF EXISTS "version_seo_meta_title",
      DROP COLUMN IF EXISTS "version_seo_meta_description";

    ALTER TABLE "pages_locales"
      DROP COLUMN IF EXISTS "seo_meta_title",
      DROP COLUMN IF EXISTS "seo_meta_description";

    ALTER TABLE "_pages_v_locales"
      DROP COLUMN IF EXISTS "version_seo_meta_title",
      DROP COLUMN IF EXISTS "version_seo_meta_description";
  `)
}
