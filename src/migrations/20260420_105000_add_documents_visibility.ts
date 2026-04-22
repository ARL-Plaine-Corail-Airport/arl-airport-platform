import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_documents_visibility" AS ENUM('public', 'internal', 'restricted');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "documents"
      ADD COLUMN IF NOT EXISTS "visibility" "public"."enum_documents_visibility" NOT NULL DEFAULT 'internal';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "documents" DROP COLUMN IF EXISTS "visibility";
    DROP TYPE IF EXISTS "public"."enum_documents_visibility";
  `)
}
