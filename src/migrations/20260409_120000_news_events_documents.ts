import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news_events_attachments" DROP CONSTRAINT "news_events_attachments_file_id_media_id_fk";
  
   ALTER TABLE "_news_events_v_version_attachments" DROP CONSTRAINT "_news_events_v_version_attachments_file_id_media_id_fk";
  
   ALTER TABLE "news_events_attachments" ADD CONSTRAINT "news_events_attachments_file_id_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "_news_events_v_version_attachments" ADD CONSTRAINT "_news_events_v_version_attachments_file_id_documents_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "news_events_attachments" DROP CONSTRAINT "news_events_attachments_file_id_documents_id_fk";
  
   ALTER TABLE "_news_events_v_version_attachments" DROP CONSTRAINT "_news_events_v_version_attachments_file_id_documents_id_fk";
  
   ALTER TABLE "news_events_attachments" ADD CONSTRAINT "news_events_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
   ALTER TABLE "_news_events_v_version_attachments" ADD CONSTRAINT "_news_events_v_version_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;`)
}
