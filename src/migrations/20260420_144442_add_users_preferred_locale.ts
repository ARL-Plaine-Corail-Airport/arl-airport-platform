import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_users_preferred_locale" AS ENUM('en', 'fr', 'mfe');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "preferred_locale" "public"."enum_users_preferred_locale" DEFAULT 'en';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "preferred_locale";
    DROP TYPE IF EXISTS "public"."enum_users_preferred_locale";
  `)
}
