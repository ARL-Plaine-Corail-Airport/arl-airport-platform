import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     CREATE TYPE "public"."enum_airport_map_points_category" AS ENUM('terminal', 'parking', 'transport', 'accessibility', 'security', 'services');
   EXCEPTION WHEN duplicate_object THEN NULL;
   END $$;
  ALTER TABLE "airport_map_points" ALTER COLUMN "category" SET DATA TYPE "public"."enum_airport_map_points_category" USING "category"::"public"."enum_airport_map_points_category";
  ALTER TABLE "airport_map_points" ADD COLUMN IF NOT EXISTS "lat" numeric;
  ALTER TABLE "airport_map_points" ADD COLUMN IF NOT EXISTS "lng" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "airport_map_points" ALTER COLUMN "category" SET DATA TYPE varchar;
  ALTER TABLE "airport_map_points" DROP COLUMN IF EXISTS "lat";
  ALTER TABLE "airport_map_points" DROP COLUMN IF EXISTS "lng";
  DROP TYPE IF EXISTS "public"."enum_airport_map_points_category";`)
}
