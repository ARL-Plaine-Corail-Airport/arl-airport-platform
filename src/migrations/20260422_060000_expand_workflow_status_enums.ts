import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Expands live and version status enums so Payload configs that allow
// in_review / approved / expired / archived can write them without the
// Postgres boundary rejecting the transition.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_careers_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum_careers_status" ADD VALUE IF NOT EXISTS 'archived';
    ALTER TYPE "public"."enum__careers_v_version_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum__careers_v_version_status" ADD VALUE IF NOT EXISTS 'archived';

    ALTER TYPE "public"."enum_news_events_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum_news_events_status" ADD VALUE IF NOT EXISTS 'archived';
    ALTER TYPE "public"."enum__news_events_v_version_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum__news_events_v_version_status" ADD VALUE IF NOT EXISTS 'archived';

    ALTER TYPE "public"."enum_airport_project_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum_airport_project_status" ADD VALUE IF NOT EXISTS 'archived';
    ALTER TYPE "public"."enum__airport_project_v_version_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum__airport_project_v_version_status" ADD VALUE IF NOT EXISTS 'archived';

    ALTER TYPE "public"."enum_pages_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum__pages_v_version_status" ADD VALUE IF NOT EXISTS 'in_review';

    ALTER TYPE "public"."enum_notices_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum_notices_status" ADD VALUE IF NOT EXISTS 'approved';
    ALTER TYPE "public"."enum_notices_status" ADD VALUE IF NOT EXISTS 'expired';
    ALTER TYPE "public"."enum_notices_status" ADD VALUE IF NOT EXISTS 'archived';
    ALTER TYPE "public"."enum__notices_v_version_status" ADD VALUE IF NOT EXISTS 'in_review';
    ALTER TYPE "public"."enum__notices_v_version_status" ADD VALUE IF NOT EXISTS 'approved';
    ALTER TYPE "public"."enum__notices_v_version_status" ADD VALUE IF NOT EXISTS 'expired';
    ALTER TYPE "public"."enum__notices_v_version_status" ADD VALUE IF NOT EXISTS 'archived';
  `)
}

// Postgres does not support removing values from an enum without rewriting
// dependent columns. A true rollback would have to drop and recreate each
// type along with every column that references it; leaving the new values
// in place is the safe, idempotent no-op.
export async function down(_args: MigrateDownArgs): Promise<void> {
  return
}
