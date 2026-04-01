import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "contact_info_cards_locales" (
  	"title" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  ALTER TABLE "airport_project_attachments" DROP CONSTRAINT "airport_project_attachments_file_id_media_id_fk";
  
  ALTER TABLE "_airport_project_v_version_attachments" DROP CONSTRAINT "_airport_project_v_version_attachments_file_id_media_id_fk";
  
  ALTER TABLE "contact_info_cards_locales" ADD CONSTRAINT "contact_info_cards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_info_cards"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "contact_info_cards_locales_locale_parent_id_unique" ON "contact_info_cards_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "airport_project_attachments" ADD CONSTRAINT "airport_project_attachments_file_id_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_airport_project_v_version_attachments" ADD CONSTRAINT "_airport_project_v_version_attachments_file_id_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_info_cards" DROP COLUMN "title";
  ALTER TABLE "contact_info_cards" DROP COLUMN "value";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "contact_info_cards_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "contact_info_cards_locales" CASCADE;
  ALTER TABLE "airport_project_attachments" DROP CONSTRAINT "airport_project_attachments_file_id_documents_id_fk";
  
  ALTER TABLE "_airport_project_v_version_attachments" DROP CONSTRAINT "_airport_project_v_version_attachments_file_id_documents_id_fk";
  
  ALTER TABLE "contact_info_cards" ADD COLUMN "title" varchar NOT NULL;
  ALTER TABLE "contact_info_cards" ADD COLUMN "value" varchar NOT NULL;
  ALTER TABLE "airport_project_attachments" ADD CONSTRAINT "airport_project_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_airport_project_v_version_attachments" ADD CONSTRAINT "_airport_project_v_version_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`)
}
