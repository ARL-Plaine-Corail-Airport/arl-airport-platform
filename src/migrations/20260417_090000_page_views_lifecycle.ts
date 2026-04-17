import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "page_views"
      ADD COLUMN IF NOT EXISTS "locale" "_locales";

    UPDATE "page_views"
    SET "locale" = CASE
      WHEN split_part("path", '/', 2) IN ('en', 'fr', 'mfe')
        THEN split_part("path", '/', 2)::"_locales"
      ELSE NULL
    END
    WHERE "locale" IS NULL;

    CREATE INDEX IF NOT EXISTS "page_views_created_at_locale_idx"
      ON "page_views" USING btree ("created_at", "locale");

    CREATE INDEX IF NOT EXISTS "page_views_path_created_at_idx"
      ON "page_views" USING btree ("path", "created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "page_views_path_created_at_idx";
    DROP INDEX IF EXISTS "page_views_created_at_locale_idx";
    ALTER TABLE "page_views" DROP COLUMN IF EXISTS "locale";
  `)
}
