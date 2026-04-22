import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION pg_temp.add_slug_length_check(
      p_table_name text,
      p_column_name text,
      p_constraint_name text
    ) RETURNS void AS $$
    BEGIN
      IF to_regclass('public.' || p_table_name) IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = p_table_name
            AND column_name = p_column_name
        )
      THEN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %I CHECK (char_length(%I) <= 120) NOT VALID',
          p_table_name,
          p_constraint_name,
          p_column_name
        );
      END IF;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
    $$ LANGUAGE plpgsql;

    SELECT pg_temp.add_slug_length_check('airport_project', 'slug', 'airport_project_slug_length_check');
    SELECT pg_temp.add_slug_length_check('_airport_project_v', 'version_slug', '_airport_project_v_version_slug_length_check');
    SELECT pg_temp.add_slug_length_check('careers', 'slug', 'careers_slug_length_check');
    SELECT pg_temp.add_slug_length_check('_careers_v', 'version_slug', '_careers_v_version_slug_length_check');
    SELECT pg_temp.add_slug_length_check('news_events', 'slug', 'news_events_slug_length_check');
    SELECT pg_temp.add_slug_length_check('_news_events_v', 'version_slug', '_news_events_v_version_slug_length_check');
    SELECT pg_temp.add_slug_length_check('notices', 'slug', 'notices_slug_length_check');
    SELECT pg_temp.add_slug_length_check('_notices_v', 'version_slug', '_notices_v_version_slug_length_check');
    SELECT pg_temp.add_slug_length_check('pages', 'slug', 'pages_slug_length_check');
    SELECT pg_temp.add_slug_length_check('_pages_v', 'version_slug', '_pages_v_version_slug_length_check');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS "airport_project" DROP CONSTRAINT IF EXISTS "airport_project_slug_length_check";
    ALTER TABLE IF EXISTS "_airport_project_v" DROP CONSTRAINT IF EXISTS "_airport_project_v_version_slug_length_check";
    ALTER TABLE IF EXISTS "careers" DROP CONSTRAINT IF EXISTS "careers_slug_length_check";
    ALTER TABLE IF EXISTS "_careers_v" DROP CONSTRAINT IF EXISTS "_careers_v_version_slug_length_check";
    ALTER TABLE IF EXISTS "news_events" DROP CONSTRAINT IF EXISTS "news_events_slug_length_check";
    ALTER TABLE IF EXISTS "_news_events_v" DROP CONSTRAINT IF EXISTS "_news_events_v_version_slug_length_check";
    ALTER TABLE IF EXISTS "notices" DROP CONSTRAINT IF EXISTS "notices_slug_length_check";
    ALTER TABLE IF EXISTS "_notices_v" DROP CONSTRAINT IF EXISTS "_notices_v_version_slug_length_check";
    ALTER TABLE IF EXISTS "pages" DROP CONSTRAINT IF EXISTS "pages_slug_length_check";
    ALTER TABLE IF EXISTS "_pages_v" DROP CONSTRAINT IF EXISTS "_pages_v_version_slug_length_check";
  `)
}
