import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "news_events_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"file_id" integer
  );
  
  CREATE TABLE "news_events_attachments_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_news_events_v_version_attachments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"file_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_news_events_v_version_attachments_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "news_events_attachments" ADD CONSTRAINT "news_events_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_events_attachments" ADD CONSTRAINT "news_events_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_events_attachments_locales" ADD CONSTRAINT "news_events_attachments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_events_attachments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_events_v_version_attachments" ADD CONSTRAINT "_news_events_v_version_attachments_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_events_v_version_attachments" ADD CONSTRAINT "_news_events_v_version_attachments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_events_v_version_attachments_locales" ADD CONSTRAINT "_news_events_v_version_attachments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_events_v_version_attachments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "news_events_attachments_order_idx" ON "news_events_attachments" USING btree ("_order");
  CREATE INDEX "news_events_attachments_parent_id_idx" ON "news_events_attachments" USING btree ("_parent_id");
  CREATE INDEX "news_events_attachments_file_idx" ON "news_events_attachments" USING btree ("file_id");
  CREATE UNIQUE INDEX "news_events_attachments_locales_locale_parent_id_unique" ON "news_events_attachments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_news_events_v_version_attachments_order_idx" ON "_news_events_v_version_attachments" USING btree ("_order");
  CREATE INDEX "_news_events_v_version_attachments_parent_id_idx" ON "_news_events_v_version_attachments" USING btree ("_parent_id");
  CREATE INDEX "_news_events_v_version_attachments_file_idx" ON "_news_events_v_version_attachments" USING btree ("file_id");
  CREATE UNIQUE INDEX "_news_events_v_version_attachments_locales_locale_parent_id_" ON "_news_events_v_version_attachments_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "news_events_attachments" CASCADE;
  DROP TABLE "news_events_attachments_locales" CASCADE;
  DROP TABLE "_news_events_v_version_attachments" CASCADE;
  DROP TABLE "_news_events_v_version_attachments_locales" CASCADE;`)
}
