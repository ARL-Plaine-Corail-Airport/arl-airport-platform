import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('super_admin', 'content_admin', 'approver', 'operations_editor', 'translator', 'viewer_auditor');
  CREATE TYPE "public"."enum_media_media_category" AS ENUM('hero', 'page', 'airline', 'staff', 'news', 'amenity', 'map', 'general');
  CREATE TYPE "public"."enum_documents_document_type" AS ENUM('communique', 'guidance', 'regulation', 'fee_schedule', 'general');
  CREATE TYPE "public"."enum_notices_category" AS ENUM('operational', 'passenger_info', 'regulation', 'fee', 'emergency', 'corporate');
  CREATE TYPE "public"."enum_notices_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__notices_v_version_category" AS ENUM('operational', 'passenger_info', 'regulation', 'fee', 'emergency', 'corporate');
  CREATE TYPE "public"."enum__notices_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__notices_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_faqs_category" AS ENUM('general', 'flights', 'transport', 'accessibility', 'documents');
  CREATE TYPE "public"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_airlines_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__airlines_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__airlines_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_news_events_type" AS ENUM('news', 'event', 'press', 'announcement');
  CREATE TYPE "public"."enum_news_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_events_v_version_type" AS ENUM('news', 'event', 'press', 'announcement');
  CREATE TYPE "public"."enum__news_events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__news_events_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_regulations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__regulations_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__regulations_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_usage_fees_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__usage_fees_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__usage_fees_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_vip_lounge_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__vip_lounge_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__vip_lounge_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_emergency_services_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__emergency_services_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__emergency_services_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_working_hours_directions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__working_hours_directions_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__working_hours_directions_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_useful_links_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__useful_links_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__useful_links_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_management_staff_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__management_staff_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__management_staff_v_published_locale" AS ENUM('en', 'fr');
  CREATE TYPE "public"."enum_legal_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__legal_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__legal_pages_v_published_locale" AS ENUM('en', 'fr');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar NOT NULL,
  	"mfa_required" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_category" "enum_media_media_category",
  	"prefix" varchar DEFAULT 'uploads',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"document_type" "enum_documents_document_type" NOT NULL,
  	"effective_date" timestamp(3) with time zone,
  	"expiry_date" timestamp(3) with time zone,
  	"is_active" boolean DEFAULT true,
  	"uploaded_at" timestamp(3) with time zone,
  	"uploaded_by_id" integer,
  	"prefix" varchar DEFAULT 'uploads',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "documents_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "notices" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"category" "enum_notices_category" DEFAULT 'operational',
  	"status" "enum_notices_status" DEFAULT 'draft',
  	"urgent" boolean DEFAULT false,
  	"pinned" boolean DEFAULT false,
  	"promote_to_banner" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"last_approved_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_notices_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "notices_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "notices_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_notices_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_category" "enum__notices_v_version_category" DEFAULT 'operational',
  	"version_status" "enum__notices_v_version_status" DEFAULT 'draft',
  	"version_urgent" boolean DEFAULT false,
  	"version_pinned" boolean DEFAULT false,
  	"version_promote_to_banner" boolean DEFAULT false,
  	"version_published_at" timestamp(3) with time zone,
  	"version_expires_at" timestamp(3) with time zone,
  	"version_last_approved_by_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__notices_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__notices_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_notices_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_notices_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "pages_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"status" "enum_pages_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_version_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum_faqs_category" DEFAULT 'general',
  	"order" numeric DEFAULT 0,
  	"status" "enum_faqs_status" DEFAULT 'published',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs_locales" (
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "airlines_destinations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"airport_code" varchar
  );
  
  CREATE TABLE "airlines_destinations_locales" (
  	"city" varchar,
  	"country" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "airlines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"iata_code" varchar,
  	"icao_code" varchar,
  	"logo_id" integer,
  	"website" varchar,
  	"contact_phone" varchar,
  	"is_active" boolean DEFAULT true,
  	"display_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_airlines_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "airlines_locales" (
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_airlines_v_version_destinations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"airport_code" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_airlines_v_version_destinations_locales" (
  	"city" varchar,
  	"country" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_airlines_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_iata_code" varchar,
  	"version_icao_code" varchar,
  	"version_logo_id" integer,
  	"version_website" varchar,
  	"version_contact_phone" varchar,
  	"version_is_active" boolean DEFAULT true,
  	"version_display_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__airlines_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__airlines_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_airlines_v_locales" (
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "news_events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"type" "enum_news_events_type",
  	"featured_image_id" integer,
  	"event_details_start_date" timestamp(3) with time zone,
  	"event_details_end_date" timestamp(3) with time zone,
  	"status" "enum_news_events_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"is_pinned" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_news_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "news_events_locales" (
  	"title" varchar,
  	"summary" varchar,
  	"body" varchar,
  	"event_details_location" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_news_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_type" "enum__news_events_v_version_type",
  	"version_featured_image_id" integer,
  	"version_event_details_start_date" timestamp(3) with time zone,
  	"version_event_details_end_date" timestamp(3) with time zone,
  	"version_status" "enum__news_events_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_is_pinned" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__news_events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__news_events_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_news_events_v_locales" (
  	"version_title" varchar,
  	"version_summary" varchar,
  	"version_body" varchar,
  	"version_event_details_location" varchar,
  	"version_seo_meta_title" varchar,
  	"version_seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"documents_id" integer,
  	"notices_id" integer,
  	"pages_id" integer,
  	"faqs_id" integer,
  	"airlines_id" integer,
  	"news_events_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_useful_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'Airport of Rodrigues Ltd' NOT NULL,
  	"airport_name" varchar DEFAULT 'Plaine Corail Airport' NOT NULL,
  	"tagline" varchar DEFAULT 'Official passenger information platform for operational notices, flight information, passenger guidance, and mobile-first access.',
  	"primary_phone" varchar DEFAULT '+230 832 78 88',
  	"primary_email" varchar DEFAULT 'info@arl.aero',
  	"physical_address" varchar DEFAULT 'Sir Gaetan Duval Airport, Rodrigues Island, Republic of Mauritius',
  	"working_hours" varchar DEFAULT 'Operational hours may vary by flight schedule and official notices.',
  	"seo_default_title" varchar DEFAULT 'Rodrigues Airport Passenger Information Platform',
  	"seo_default_description" varchar DEFAULT 'Official mobile-first platform for Plaine Corail Airport arrivals, departures, communiqués, passenger guidance, accessibility, transport, and airport contact information.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_services_preview" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_locales" (
  	"hero_title" varchar DEFAULT 'Official passenger information for Plaine Corail Airport' NOT NULL,
  	"hero_summary" varchar DEFAULT 'Check arrivals and departures, read official communiqués, prepare your journey, and access transport, accessibility, and contact information from one mobile-first platform.' NOT NULL,
  	"emergency_alert_title" varchar DEFAULT 'Important operational information',
  	"emergency_alert_body" varchar DEFAULT 'Urgent communiqués and service disruptions can be promoted here from the notices workflow when approved for site-wide display.',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "passenger_guide_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "passenger_guide_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "passenger_guide_important_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "passenger_guide" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "passenger_guide_locales" (
  	"intro_title" varchar DEFAULT 'Prepare for your journey' NOT NULL,
  	"intro_summary" varchar DEFAULT 'Use this guide to review check-in, baggage, security, accessibility support, and key airport contact information before travelling.' NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "transport_parking_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "transport_parking_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "transport_parking" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"map_embed_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "transport_parking_locales" (
  	"intro_title" varchar DEFAULT 'Transport and parking information' NOT NULL,
  	"intro_summary" varchar DEFAULT 'Review drop-off, pickup, car park, taxi, bus, shuttle, and direction information before travelling to the airport.' NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "accessibility_info_sections_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "accessibility_info_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  
  CREATE TABLE "accessibility_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"assistance_contact" varchar DEFAULT 'Contact the help desk or your airline in advance to request assistance.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "accessibility_info_locales" (
  	"intro_title" varchar DEFAULT 'Accessibility support' NOT NULL,
  	"intro_summary" varchar DEFAULT 'Find information about reduced mobility assistance, terminal accessibility, accessible parking, and support contacts.' NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "airport_map_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"category" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "airport_map" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"map_embed_u_r_l" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "airport_map_locales" (
  	"intro_title" varchar DEFAULT 'Airport map and key points' NOT NULL,
  	"intro_summary" varchar DEFAULT 'Locate terminal approaches, parking zones, pickup points, accessibility areas, and transport connection points.' NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "contact_info_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"link" varchar
  );
  
  CREATE TABLE "contact_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "contact_info_locales" (
  	"help_desk_title" varchar DEFAULT 'Contact and help desk' NOT NULL,
  	"help_desk_summary" varchar DEFAULT 'Use the official help desk details below for passenger information, accessibility assistance, and general airport enquiries.' NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "regulations_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"attached_document_id" integer
  );
  
  CREATE TABLE "regulations_sections_locales" (
  	"heading" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "regulations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"last_reviewed_date" timestamp(3) with time zone,
  	"_status" "enum_regulations_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "regulations_locales" (
  	"page_title" varchar DEFAULT 'Airport Regulations',
  	"introduction" varchar,
  	"legal_disclaimer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regulations_v_version_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"attached_document_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_regulations_v_version_sections_locales" (
  	"heading" varchar,
  	"body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_regulations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_last_reviewed_date" timestamp(3) with time zone,
  	"version__status" "enum__regulations_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__regulations_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_regulations_v_locales" (
  	"version_page_title" varchar DEFAULT 'Airport Regulations',
  	"version_introduction" varchar,
  	"version_legal_disclaimer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "usage_fees_fee_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"official_schedule_p_d_f_id" integer,
  	"effective_from" timestamp(3) with time zone
  );
  
  CREATE TABLE "usage_fees_fee_categories_locales" (
  	"category_name" varchar,
  	"description" varchar,
  	"note_on_source" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "usage_fees" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_for_enquiries_name" varchar,
  	"contact_for_enquiries_phone" varchar,
  	"contact_for_enquiries_email" varchar,
  	"last_approved_date" timestamp(3) with time zone,
  	"_status" "enum_usage_fees_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "usage_fees_locales" (
  	"page_title" varchar DEFAULT 'Airport Usage Fees',
  	"introduction" varchar,
  	"payment_methods" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_usage_fees_v_version_fee_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"official_schedule_p_d_f_id" integer,
  	"effective_from" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_usage_fees_v_version_fee_categories_locales" (
  	"category_name" varchar,
  	"description" varchar,
  	"note_on_source" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_usage_fees_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_contact_for_enquiries_name" varchar,
  	"version_contact_for_enquiries_phone" varchar,
  	"version_contact_for_enquiries_email" varchar,
  	"version_last_approved_date" timestamp(3) with time zone,
  	"version__status" "enum__usage_fees_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__usage_fees_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_usage_fees_v_locales" (
  	"version_page_title" varchar DEFAULT 'Airport Usage Fees',
  	"version_introduction" varchar,
  	"version_payment_methods" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "vip_lounge_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "vip_lounge_amenities_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "vip_lounge_lounge_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "vip_lounge" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"contact_phone" varchar,
  	"contact_email" varchar,
  	"_status" "enum_vip_lounge_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "vip_lounge_locales" (
  	"page_title" varchar DEFAULT 'VIP Lounge',
  	"introduction" varchar,
  	"eligibility" varchar,
  	"booking_information" varchar,
  	"operating_hours" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_vip_lounge_v_version_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vip_lounge_v_version_amenities_locales" (
  	"item" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_vip_lounge_v_version_lounge_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vip_lounge_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_contact_phone" varchar,
  	"version_contact_email" varchar,
  	"version__status" "enum__vip_lounge_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__vip_lounge_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_vip_lounge_v_locales" (
  	"version_page_title" varchar DEFAULT 'VIP Lounge',
  	"version_introduction" varchar,
  	"version_eligibility" varchar,
  	"version_booking_information" varchar,
  	"version_operating_hours" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "emergency_services_service_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"phone" varchar,
  	"available24h" boolean DEFAULT true
  );
  
  CREATE TABLE "emergency_services_service_contacts_locales" (
  	"service_name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "emergency_services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"primary_emergency_number" varchar,
  	"last_verified_date" timestamp(3) with time zone,
  	"verified_by" varchar,
  	"_status" "enum_emergency_services_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "emergency_services_locales" (
  	"page_title" varchar DEFAULT 'Emergency Services',
  	"introduction" varchar,
  	"medical_facilities" varchar,
  	"evacuation_procedures" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_emergency_services_v_version_service_contacts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar,
  	"available24h" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_emergency_services_v_version_service_contacts_locales" (
  	"service_name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_emergency_services_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_primary_emergency_number" varchar,
  	"version_last_verified_date" timestamp(3) with time zone,
  	"version_verified_by" varchar,
  	"version__status" "enum__emergency_services_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__emergency_services_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_emergency_services_v_locales" (
  	"version_page_title" varchar DEFAULT 'Emergency Services',
  	"version_introduction" varchar,
  	"version_medical_facilities" varchar,
  	"version_evacuation_procedures" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "working_hours_directions_op_hours_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "working_hours_directions_op_hours_schedule_locales" (
  	"day_or_period" varchar,
  	"hours" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "working_hours_directions_department_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "working_hours_directions_department_hours_locales" (
  	"department" varchar,
  	"hours" varchar,
  	"notes" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "working_hours_directions_getting_here" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "working_hours_directions_getting_here_locales" (
  	"transport_mode" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "working_hours_directions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"location_google_maps_u_r_l" varchar,
  	"location_map_embed_u_r_l" varchar,
  	"location_coordinates_latitude" numeric,
  	"location_coordinates_longitude" numeric,
  	"_status" "enum_working_hours_directions_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "working_hours_directions_locales" (
  	"page_title" varchar DEFAULT 'Working Hours & Directions',
  	"op_hours_description" varchar,
  	"location_address" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_working_hours_directions_v_version_op_hours_schedule" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_working_hours_directions_v_version_op_hours_schedule_locales" (
  	"day_or_period" varchar,
  	"hours" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_working_hours_directions_v_version_department_hours" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_working_hours_directions_v_version_department_hours_locales" (
  	"department" varchar,
  	"hours" varchar,
  	"notes" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_working_hours_directions_v_version_getting_here" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_working_hours_directions_v_version_getting_here_locales" (
  	"transport_mode" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_working_hours_directions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_location_google_maps_u_r_l" varchar,
  	"version_location_map_embed_u_r_l" varchar,
  	"version_location_coordinates_latitude" numeric,
  	"version_location_coordinates_longitude" numeric,
  	"version__status" "enum__working_hours_directions_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__working_hours_directions_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_working_hours_directions_v_locales" (
  	"version_page_title" varchar DEFAULT 'Working Hours & Directions',
  	"version_op_hours_description" varchar,
  	"version_location_address" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "useful_links_link_groups_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"open_in_new_tab" boolean DEFAULT true
  );
  
  CREATE TABLE "useful_links_link_groups_links_locales" (
  	"label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "useful_links_link_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "useful_links_link_groups_locales" (
  	"group_name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "useful_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_useful_links_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "useful_links_locales" (
  	"page_title" varchar DEFAULT 'Useful Links',
  	"introduction" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_useful_links_v_version_link_groups_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"open_in_new_tab" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_useful_links_v_version_link_groups_links_locales" (
  	"label" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_useful_links_v_version_link_groups" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_useful_links_v_version_link_groups_locales" (
  	"group_name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_useful_links_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__useful_links_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__useful_links_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_useful_links_v_locales" (
  	"version_page_title" varchar DEFAULT 'Useful Links',
  	"version_introduction" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "management_staff_management_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"photo_id" integer,
  	"display_order" numeric DEFAULT 0,
  	"is_visible" boolean DEFAULT true
  );
  
  CREATE TABLE "management_staff_management_team_locales" (
  	"title" varchar,
  	"bio" varchar,
  	"department" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "management_staff_departments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "management_staff_departments_locales" (
  	"department_name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "management_staff" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_management_staff_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "management_staff_locales" (
  	"page_title" varchar DEFAULT 'Management & Staff',
  	"introduction" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_management_staff_v_version_management_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"photo_id" integer,
  	"display_order" numeric DEFAULT 0,
  	"is_visible" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_management_staff_v_version_management_team_locales" (
  	"title" varchar,
  	"bio" varchar,
  	"department" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_management_staff_v_version_departments" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_management_staff_v_version_departments_locales" (
  	"department_name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_management_staff_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__management_staff_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__management_staff_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_management_staff_v_locales" (
  	"version_page_title" varchar DEFAULT 'Management & Staff',
  	"version_introduction" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "legal_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"disclaimer_last_updated" timestamp(3) with time zone,
  	"terms_of_use_last_updated" timestamp(3) with time zone,
  	"terms_of_use_effective_date" timestamp(3) with time zone,
  	"privacy_policy_last_updated" timestamp(3) with time zone,
  	"privacy_policy_data_controller_name" varchar,
  	"privacy_policy_data_controller_email" varchar,
  	"cookie_policy_last_updated" timestamp(3) with time zone,
  	"_status" "enum_legal_pages_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "legal_pages_locales" (
  	"disclaimer_title" varchar DEFAULT 'Disclaimer',
  	"disclaimer_content" varchar,
  	"terms_of_use_title" varchar DEFAULT 'Terms of Use',
  	"terms_of_use_content" varchar,
  	"privacy_policy_title" varchar DEFAULT 'Privacy Policy',
  	"privacy_policy_content" varchar,
  	"cookie_policy_title" varchar DEFAULT 'Cookie Policy',
  	"cookie_policy_content" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_legal_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_disclaimer_last_updated" timestamp(3) with time zone,
  	"version_terms_of_use_last_updated" timestamp(3) with time zone,
  	"version_terms_of_use_effective_date" timestamp(3) with time zone,
  	"version_privacy_policy_last_updated" timestamp(3) with time zone,
  	"version_privacy_policy_data_controller_name" varchar,
  	"version_privacy_policy_data_controller_email" varchar,
  	"version_cookie_policy_last_updated" timestamp(3) with time zone,
  	"version__status" "enum__legal_pages_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__legal_pages_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_legal_pages_v_locales" (
  	"version_disclaimer_title" varchar DEFAULT 'Disclaimer',
  	"version_disclaimer_content" varchar,
  	"version_terms_of_use_title" varchar DEFAULT 'Terms of Use',
  	"version_terms_of_use_content" varchar,
  	"version_privacy_policy_title" varchar DEFAULT 'Privacy Policy',
  	"version_privacy_policy_content" varchar,
  	"version_cookie_policy_title" varchar DEFAULT 'Cookie Policy',
  	"version_cookie_policy_content" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents_locales" ADD CONSTRAINT "documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notices" ADD CONSTRAINT "notices_last_approved_by_id_users_id_fk" FOREIGN KEY ("last_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notices_locales" ADD CONSTRAINT "notices_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notices_rels" ADD CONSTRAINT "notices_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notices_rels" ADD CONSTRAINT "notices_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notices_v" ADD CONSTRAINT "_notices_v_parent_id_notices_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notices"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_notices_v" ADD CONSTRAINT "_notices_v_version_last_approved_by_id_users_id_fk" FOREIGN KEY ("version_last_approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_notices_v_locales" ADD CONSTRAINT "_notices_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_notices_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notices_v_rels" ADD CONSTRAINT "_notices_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_notices_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notices_v_rels" ADD CONSTRAINT "_notices_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_sections_bullets" ADD CONSTRAINT "pages_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_sections" ADD CONSTRAINT "pages_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_sections_bullets" ADD CONSTRAINT "_pages_v_version_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_sections" ADD CONSTRAINT "_pages_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "faqs_locales" ADD CONSTRAINT "faqs_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "airlines_destinations" ADD CONSTRAINT "airlines_destinations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."airlines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "airlines_destinations_locales" ADD CONSTRAINT "airlines_destinations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."airlines_destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "airlines" ADD CONSTRAINT "airlines_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "airlines_locales" ADD CONSTRAINT "airlines_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."airlines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_airlines_v_version_destinations" ADD CONSTRAINT "_airlines_v_version_destinations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_airlines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_airlines_v_version_destinations_locales" ADD CONSTRAINT "_airlines_v_version_destinations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_airlines_v_version_destinations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_airlines_v" ADD CONSTRAINT "_airlines_v_parent_id_airlines_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."airlines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_airlines_v" ADD CONSTRAINT "_airlines_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_airlines_v_locales" ADD CONSTRAINT "_airlines_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_airlines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "news_events" ADD CONSTRAINT "news_events_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "news_events_locales" ADD CONSTRAINT "news_events_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."news_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_news_events_v" ADD CONSTRAINT "_news_events_v_parent_id_news_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."news_events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_events_v" ADD CONSTRAINT "_news_events_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_news_events_v_locales" ADD CONSTRAINT "_news_events_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_news_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notices_fk" FOREIGN KEY ("notices_id") REFERENCES "public"."notices"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_airlines_fk" FOREIGN KEY ("airlines_id") REFERENCES "public"."airlines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_events_fk" FOREIGN KEY ("news_events_id") REFERENCES "public"."news_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_social_links" ADD CONSTRAINT "site_settings_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_useful_links" ADD CONSTRAINT "site_settings_useful_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_services_preview" ADD CONSTRAINT "home_page_services_preview_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "passenger_guide_sections_bullets" ADD CONSTRAINT "passenger_guide_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."passenger_guide_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "passenger_guide_sections" ADD CONSTRAINT "passenger_guide_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."passenger_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "passenger_guide_important_contacts" ADD CONSTRAINT "passenger_guide_important_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."passenger_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "passenger_guide_locales" ADD CONSTRAINT "passenger_guide_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."passenger_guide"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transport_parking_sections_bullets" ADD CONSTRAINT "transport_parking_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."transport_parking_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transport_parking_sections" ADD CONSTRAINT "transport_parking_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."transport_parking"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "transport_parking_locales" ADD CONSTRAINT "transport_parking_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."transport_parking"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accessibility_info_sections_bullets" ADD CONSTRAINT "accessibility_info_sections_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accessibility_info_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accessibility_info_sections" ADD CONSTRAINT "accessibility_info_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accessibility_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "accessibility_info_locales" ADD CONSTRAINT "accessibility_info_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."accessibility_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "airport_map_points" ADD CONSTRAINT "airport_map_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."airport_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "airport_map_locales" ADD CONSTRAINT "airport_map_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."airport_map"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_info_cards" ADD CONSTRAINT "contact_info_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_info_locales" ADD CONSTRAINT "contact_info_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regulations_sections" ADD CONSTRAINT "regulations_sections_attached_document_id_documents_id_fk" FOREIGN KEY ("attached_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "regulations_sections" ADD CONSTRAINT "regulations_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regulations_sections_locales" ADD CONSTRAINT "regulations_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regulations_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "regulations_locales" ADD CONSTRAINT "regulations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."regulations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regulations_v_version_sections" ADD CONSTRAINT "_regulations_v_version_sections_attached_document_id_documents_id_fk" FOREIGN KEY ("attached_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_regulations_v_version_sections" ADD CONSTRAINT "_regulations_v_version_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regulations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regulations_v_version_sections_locales" ADD CONSTRAINT "_regulations_v_version_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regulations_v_version_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_regulations_v_locales" ADD CONSTRAINT "_regulations_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_regulations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "usage_fees_fee_categories" ADD CONSTRAINT "usage_fees_fee_categories_official_schedule_p_d_f_id_documents_id_fk" FOREIGN KEY ("official_schedule_p_d_f_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "usage_fees_fee_categories" ADD CONSTRAINT "usage_fees_fee_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."usage_fees"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "usage_fees_fee_categories_locales" ADD CONSTRAINT "usage_fees_fee_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."usage_fees_fee_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "usage_fees_locales" ADD CONSTRAINT "usage_fees_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."usage_fees"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_usage_fees_v_version_fee_categories" ADD CONSTRAINT "_usage_fees_v_version_fee_categories_official_schedule_p_d_f_id_documents_id_fk" FOREIGN KEY ("official_schedule_p_d_f_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_usage_fees_v_version_fee_categories" ADD CONSTRAINT "_usage_fees_v_version_fee_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_usage_fees_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_usage_fees_v_version_fee_categories_locales" ADD CONSTRAINT "_usage_fees_v_version_fee_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_usage_fees_v_version_fee_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_usage_fees_v_locales" ADD CONSTRAINT "_usage_fees_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_usage_fees_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vip_lounge_amenities" ADD CONSTRAINT "vip_lounge_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vip_lounge"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vip_lounge_amenities_locales" ADD CONSTRAINT "vip_lounge_amenities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vip_lounge_amenities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vip_lounge_lounge_images" ADD CONSTRAINT "vip_lounge_lounge_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vip_lounge_lounge_images" ADD CONSTRAINT "vip_lounge_lounge_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vip_lounge"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vip_lounge_locales" ADD CONSTRAINT "vip_lounge_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vip_lounge"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vip_lounge_v_version_amenities" ADD CONSTRAINT "_vip_lounge_v_version_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vip_lounge_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vip_lounge_v_version_amenities_locales" ADD CONSTRAINT "_vip_lounge_v_version_amenities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vip_lounge_v_version_amenities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vip_lounge_v_version_lounge_images" ADD CONSTRAINT "_vip_lounge_v_version_lounge_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vip_lounge_v_version_lounge_images" ADD CONSTRAINT "_vip_lounge_v_version_lounge_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vip_lounge_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vip_lounge_v_locales" ADD CONSTRAINT "_vip_lounge_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vip_lounge_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "emergency_services_service_contacts" ADD CONSTRAINT "emergency_services_service_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."emergency_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "emergency_services_service_contacts_locales" ADD CONSTRAINT "emergency_services_service_contacts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."emergency_services_service_contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "emergency_services_locales" ADD CONSTRAINT "emergency_services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."emergency_services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_emergency_services_v_version_service_contacts" ADD CONSTRAINT "_emergency_services_v_version_service_contacts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_emergency_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_emergency_services_v_version_service_contacts_locales" ADD CONSTRAINT "_emergency_services_v_version_service_contacts_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_emergency_services_v_version_service_contacts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_emergency_services_v_locales" ADD CONSTRAINT "_emergency_services_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_emergency_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "working_hours_directions_op_hours_schedule" ADD CONSTRAINT "working_hours_directions_op_hours_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."working_hours_directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "working_hours_directions_op_hours_schedule_locales" ADD CONSTRAINT "working_hours_directions_op_hours_schedule_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."working_hours_directions_op_hours_schedule"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "working_hours_directions_department_hours" ADD CONSTRAINT "working_hours_directions_department_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."working_hours_directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "working_hours_directions_department_hours_locales" ADD CONSTRAINT "working_hours_directions_department_hours_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."working_hours_directions_department_hours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "working_hours_directions_getting_here" ADD CONSTRAINT "working_hours_directions_getting_here_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."working_hours_directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "working_hours_directions_getting_here_locales" ADD CONSTRAINT "working_hours_directions_getting_here_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."working_hours_directions_getting_here"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "working_hours_directions_locales" ADD CONSTRAINT "working_hours_directions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."working_hours_directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_working_hours_directions_v_version_op_hours_schedule" ADD CONSTRAINT "_working_hours_directions_v_version_op_hours_schedule_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_working_hours_directions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_working_hours_directions_v_version_op_hours_schedule_locales" ADD CONSTRAINT "_working_hours_directions_v_version_op_hours_schedule_loc_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_working_hours_directions_v_version_op_hours_schedule"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_working_hours_directions_v_version_department_hours" ADD CONSTRAINT "_working_hours_directions_v_version_department_hours_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_working_hours_directions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_working_hours_directions_v_version_department_hours_locales" ADD CONSTRAINT "_working_hours_directions_v_version_department_hours_loca_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_working_hours_directions_v_version_department_hours"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_working_hours_directions_v_version_getting_here" ADD CONSTRAINT "_working_hours_directions_v_version_getting_here_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_working_hours_directions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_working_hours_directions_v_version_getting_here_locales" ADD CONSTRAINT "_working_hours_directions_v_version_getting_here_locales__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_working_hours_directions_v_version_getting_here"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_working_hours_directions_v_locales" ADD CONSTRAINT "_working_hours_directions_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_working_hours_directions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "useful_links_link_groups_links" ADD CONSTRAINT "useful_links_link_groups_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."useful_links_link_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "useful_links_link_groups_links_locales" ADD CONSTRAINT "useful_links_link_groups_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."useful_links_link_groups_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "useful_links_link_groups" ADD CONSTRAINT "useful_links_link_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."useful_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "useful_links_link_groups_locales" ADD CONSTRAINT "useful_links_link_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."useful_links_link_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "useful_links_locales" ADD CONSTRAINT "useful_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."useful_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_useful_links_v_version_link_groups_links" ADD CONSTRAINT "_useful_links_v_version_link_groups_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_useful_links_v_version_link_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_useful_links_v_version_link_groups_links_locales" ADD CONSTRAINT "_useful_links_v_version_link_groups_links_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_useful_links_v_version_link_groups_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_useful_links_v_version_link_groups" ADD CONSTRAINT "_useful_links_v_version_link_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_useful_links_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_useful_links_v_version_link_groups_locales" ADD CONSTRAINT "_useful_links_v_version_link_groups_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_useful_links_v_version_link_groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_useful_links_v_locales" ADD CONSTRAINT "_useful_links_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_useful_links_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "management_staff_management_team" ADD CONSTRAINT "management_staff_management_team_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "management_staff_management_team" ADD CONSTRAINT "management_staff_management_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."management_staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "management_staff_management_team_locales" ADD CONSTRAINT "management_staff_management_team_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."management_staff_management_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "management_staff_departments" ADD CONSTRAINT "management_staff_departments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."management_staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "management_staff_departments_locales" ADD CONSTRAINT "management_staff_departments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."management_staff_departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "management_staff_locales" ADD CONSTRAINT "management_staff_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."management_staff"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_management_staff_v_version_management_team" ADD CONSTRAINT "_management_staff_v_version_management_team_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_management_staff_v_version_management_team" ADD CONSTRAINT "_management_staff_v_version_management_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_management_staff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_management_staff_v_version_management_team_locales" ADD CONSTRAINT "_management_staff_v_version_management_team_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_management_staff_v_version_management_team"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_management_staff_v_version_departments" ADD CONSTRAINT "_management_staff_v_version_departments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_management_staff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_management_staff_v_version_departments_locales" ADD CONSTRAINT "_management_staff_v_version_departments_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_management_staff_v_version_departments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_management_staff_v_locales" ADD CONSTRAINT "_management_staff_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_management_staff_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "legal_pages_locales" ADD CONSTRAINT "legal_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."legal_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_legal_pages_v_locales" ADD CONSTRAINT "_legal_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_legal_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "documents_uploaded_by_idx" ON "documents" USING btree ("uploaded_by_id");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "documents_filename_idx" ON "documents" USING btree ("filename");
  CREATE UNIQUE INDEX "documents_locales_locale_parent_id_unique" ON "documents_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "notices_slug_idx" ON "notices" USING btree ("slug");
  CREATE INDEX "notices_last_approved_by_idx" ON "notices" USING btree ("last_approved_by_id");
  CREATE INDEX "notices_updated_at_idx" ON "notices" USING btree ("updated_at");
  CREATE INDEX "notices_created_at_idx" ON "notices" USING btree ("created_at");
  CREATE INDEX "notices__status_idx" ON "notices" USING btree ("_status");
  CREATE UNIQUE INDEX "notices_locales_locale_parent_id_unique" ON "notices_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "notices_rels_order_idx" ON "notices_rels" USING btree ("order");
  CREATE INDEX "notices_rels_parent_idx" ON "notices_rels" USING btree ("parent_id");
  CREATE INDEX "notices_rels_path_idx" ON "notices_rels" USING btree ("path");
  CREATE INDEX "notices_rels_media_id_idx" ON "notices_rels" USING btree ("media_id");
  CREATE INDEX "_notices_v_parent_idx" ON "_notices_v" USING btree ("parent_id");
  CREATE INDEX "_notices_v_version_version_slug_idx" ON "_notices_v" USING btree ("version_slug");
  CREATE INDEX "_notices_v_version_version_last_approved_by_idx" ON "_notices_v" USING btree ("version_last_approved_by_id");
  CREATE INDEX "_notices_v_version_version_updated_at_idx" ON "_notices_v" USING btree ("version_updated_at");
  CREATE INDEX "_notices_v_version_version_created_at_idx" ON "_notices_v" USING btree ("version_created_at");
  CREATE INDEX "_notices_v_version_version__status_idx" ON "_notices_v" USING btree ("version__status");
  CREATE INDEX "_notices_v_created_at_idx" ON "_notices_v" USING btree ("created_at");
  CREATE INDEX "_notices_v_updated_at_idx" ON "_notices_v" USING btree ("updated_at");
  CREATE INDEX "_notices_v_snapshot_idx" ON "_notices_v" USING btree ("snapshot");
  CREATE INDEX "_notices_v_published_locale_idx" ON "_notices_v" USING btree ("published_locale");
  CREATE INDEX "_notices_v_latest_idx" ON "_notices_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_notices_v_locales_locale_parent_id_unique" ON "_notices_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_notices_v_rels_order_idx" ON "_notices_v_rels" USING btree ("order");
  CREATE INDEX "_notices_v_rels_parent_idx" ON "_notices_v_rels" USING btree ("parent_id");
  CREATE INDEX "_notices_v_rels_path_idx" ON "_notices_v_rels" USING btree ("path");
  CREATE INDEX "_notices_v_rels_media_id_idx" ON "_notices_v_rels" USING btree ("media_id");
  CREATE INDEX "pages_sections_bullets_order_idx" ON "pages_sections_bullets" USING btree ("_order");
  CREATE INDEX "pages_sections_bullets_parent_id_idx" ON "pages_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "pages_sections_order_idx" ON "pages_sections" USING btree ("_order");
  CREATE INDEX "pages_sections_parent_id_idx" ON "pages_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_version_sections_bullets_order_idx" ON "_pages_v_version_sections_bullets" USING btree ("_order");
  CREATE INDEX "_pages_v_version_sections_bullets_parent_id_idx" ON "_pages_v_version_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_sections_order_idx" ON "_pages_v_version_sections" USING btree ("_order");
  CREATE INDEX "_pages_v_version_sections_parent_id_idx" ON "_pages_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE UNIQUE INDEX "faqs_locales_locale_parent_id_unique" ON "faqs_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "airlines_destinations_order_idx" ON "airlines_destinations" USING btree ("_order");
  CREATE INDEX "airlines_destinations_parent_id_idx" ON "airlines_destinations" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "airlines_destinations_locales_locale_parent_id_unique" ON "airlines_destinations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "airlines_logo_idx" ON "airlines" USING btree ("logo_id");
  CREATE INDEX "airlines_updated_at_idx" ON "airlines" USING btree ("updated_at");
  CREATE INDEX "airlines_created_at_idx" ON "airlines" USING btree ("created_at");
  CREATE INDEX "airlines__status_idx" ON "airlines" USING btree ("_status");
  CREATE UNIQUE INDEX "airlines_locales_locale_parent_id_unique" ON "airlines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_airlines_v_version_destinations_order_idx" ON "_airlines_v_version_destinations" USING btree ("_order");
  CREATE INDEX "_airlines_v_version_destinations_parent_id_idx" ON "_airlines_v_version_destinations" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_airlines_v_version_destinations_locales_locale_parent_id_un" ON "_airlines_v_version_destinations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_airlines_v_parent_idx" ON "_airlines_v" USING btree ("parent_id");
  CREATE INDEX "_airlines_v_version_version_logo_idx" ON "_airlines_v" USING btree ("version_logo_id");
  CREATE INDEX "_airlines_v_version_version_updated_at_idx" ON "_airlines_v" USING btree ("version_updated_at");
  CREATE INDEX "_airlines_v_version_version_created_at_idx" ON "_airlines_v" USING btree ("version_created_at");
  CREATE INDEX "_airlines_v_version_version__status_idx" ON "_airlines_v" USING btree ("version__status");
  CREATE INDEX "_airlines_v_created_at_idx" ON "_airlines_v" USING btree ("created_at");
  CREATE INDEX "_airlines_v_updated_at_idx" ON "_airlines_v" USING btree ("updated_at");
  CREATE INDEX "_airlines_v_snapshot_idx" ON "_airlines_v" USING btree ("snapshot");
  CREATE INDEX "_airlines_v_published_locale_idx" ON "_airlines_v" USING btree ("published_locale");
  CREATE INDEX "_airlines_v_latest_idx" ON "_airlines_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_airlines_v_locales_locale_parent_id_unique" ON "_airlines_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "news_events_slug_idx" ON "news_events" USING btree ("slug");
  CREATE INDEX "news_events_featured_image_idx" ON "news_events" USING btree ("featured_image_id");
  CREATE INDEX "news_events_updated_at_idx" ON "news_events" USING btree ("updated_at");
  CREATE INDEX "news_events_created_at_idx" ON "news_events" USING btree ("created_at");
  CREATE INDEX "news_events__status_idx" ON "news_events" USING btree ("_status");
  CREATE UNIQUE INDEX "news_events_locales_locale_parent_id_unique" ON "news_events_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_news_events_v_parent_idx" ON "_news_events_v" USING btree ("parent_id");
  CREATE INDEX "_news_events_v_version_version_slug_idx" ON "_news_events_v" USING btree ("version_slug");
  CREATE INDEX "_news_events_v_version_version_featured_image_idx" ON "_news_events_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_news_events_v_version_version_updated_at_idx" ON "_news_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_news_events_v_version_version_created_at_idx" ON "_news_events_v" USING btree ("version_created_at");
  CREATE INDEX "_news_events_v_version_version__status_idx" ON "_news_events_v" USING btree ("version__status");
  CREATE INDEX "_news_events_v_created_at_idx" ON "_news_events_v" USING btree ("created_at");
  CREATE INDEX "_news_events_v_updated_at_idx" ON "_news_events_v" USING btree ("updated_at");
  CREATE INDEX "_news_events_v_snapshot_idx" ON "_news_events_v" USING btree ("snapshot");
  CREATE INDEX "_news_events_v_published_locale_idx" ON "_news_events_v" USING btree ("published_locale");
  CREATE INDEX "_news_events_v_latest_idx" ON "_news_events_v" USING btree ("latest");
  CREATE INDEX "_news_events_v_autosave_idx" ON "_news_events_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_news_events_v_locales_locale_parent_id_unique" ON "_news_events_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_notices_id_idx" ON "payload_locked_documents_rels" USING btree ("notices_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_airlines_id_idx" ON "payload_locked_documents_rels" USING btree ("airlines_id");
  CREATE INDEX "payload_locked_documents_rels_news_events_id_idx" ON "payload_locked_documents_rels" USING btree ("news_events_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_social_links_order_idx" ON "site_settings_social_links" USING btree ("_order");
  CREATE INDEX "site_settings_social_links_parent_id_idx" ON "site_settings_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_useful_links_order_idx" ON "site_settings_useful_links" USING btree ("_order");
  CREATE INDEX "site_settings_useful_links_parent_id_idx" ON "site_settings_useful_links" USING btree ("_parent_id");
  CREATE INDEX "home_page_services_preview_order_idx" ON "home_page_services_preview" USING btree ("_order");
  CREATE INDEX "home_page_services_preview_parent_id_idx" ON "home_page_services_preview" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_page_locales_locale_parent_id_unique" ON "home_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "passenger_guide_sections_bullets_order_idx" ON "passenger_guide_sections_bullets" USING btree ("_order");
  CREATE INDEX "passenger_guide_sections_bullets_parent_id_idx" ON "passenger_guide_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "passenger_guide_sections_order_idx" ON "passenger_guide_sections" USING btree ("_order");
  CREATE INDEX "passenger_guide_sections_parent_id_idx" ON "passenger_guide_sections" USING btree ("_parent_id");
  CREATE INDEX "passenger_guide_important_contacts_order_idx" ON "passenger_guide_important_contacts" USING btree ("_order");
  CREATE INDEX "passenger_guide_important_contacts_parent_id_idx" ON "passenger_guide_important_contacts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "passenger_guide_locales_locale_parent_id_unique" ON "passenger_guide_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "transport_parking_sections_bullets_order_idx" ON "transport_parking_sections_bullets" USING btree ("_order");
  CREATE INDEX "transport_parking_sections_bullets_parent_id_idx" ON "transport_parking_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "transport_parking_sections_order_idx" ON "transport_parking_sections" USING btree ("_order");
  CREATE INDEX "transport_parking_sections_parent_id_idx" ON "transport_parking_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "transport_parking_locales_locale_parent_id_unique" ON "transport_parking_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "accessibility_info_sections_bullets_order_idx" ON "accessibility_info_sections_bullets" USING btree ("_order");
  CREATE INDEX "accessibility_info_sections_bullets_parent_id_idx" ON "accessibility_info_sections_bullets" USING btree ("_parent_id");
  CREATE INDEX "accessibility_info_sections_order_idx" ON "accessibility_info_sections" USING btree ("_order");
  CREATE INDEX "accessibility_info_sections_parent_id_idx" ON "accessibility_info_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "accessibility_info_locales_locale_parent_id_unique" ON "accessibility_info_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "airport_map_points_order_idx" ON "airport_map_points" USING btree ("_order");
  CREATE INDEX "airport_map_points_parent_id_idx" ON "airport_map_points" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "airport_map_locales_locale_parent_id_unique" ON "airport_map_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "contact_info_cards_order_idx" ON "contact_info_cards" USING btree ("_order");
  CREATE INDEX "contact_info_cards_parent_id_idx" ON "contact_info_cards" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "contact_info_locales_locale_parent_id_unique" ON "contact_info_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regulations_sections_order_idx" ON "regulations_sections" USING btree ("_order");
  CREATE INDEX "regulations_sections_parent_id_idx" ON "regulations_sections" USING btree ("_parent_id");
  CREATE INDEX "regulations_sections_attached_document_idx" ON "regulations_sections" USING btree ("attached_document_id");
  CREATE UNIQUE INDEX "regulations_sections_locales_locale_parent_id_unique" ON "regulations_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "regulations__status_idx" ON "regulations" USING btree ("_status");
  CREATE UNIQUE INDEX "regulations_locales_locale_parent_id_unique" ON "regulations_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regulations_v_version_sections_order_idx" ON "_regulations_v_version_sections" USING btree ("_order");
  CREATE INDEX "_regulations_v_version_sections_parent_id_idx" ON "_regulations_v_version_sections" USING btree ("_parent_id");
  CREATE INDEX "_regulations_v_version_sections_attached_document_idx" ON "_regulations_v_version_sections" USING btree ("attached_document_id");
  CREATE UNIQUE INDEX "_regulations_v_version_sections_locales_locale_parent_id_uni" ON "_regulations_v_version_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_regulations_v_version_version__status_idx" ON "_regulations_v" USING btree ("version__status");
  CREATE INDEX "_regulations_v_created_at_idx" ON "_regulations_v" USING btree ("created_at");
  CREATE INDEX "_regulations_v_updated_at_idx" ON "_regulations_v" USING btree ("updated_at");
  CREATE INDEX "_regulations_v_snapshot_idx" ON "_regulations_v" USING btree ("snapshot");
  CREATE INDEX "_regulations_v_published_locale_idx" ON "_regulations_v" USING btree ("published_locale");
  CREATE INDEX "_regulations_v_latest_idx" ON "_regulations_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_regulations_v_locales_locale_parent_id_unique" ON "_regulations_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "usage_fees_fee_categories_order_idx" ON "usage_fees_fee_categories" USING btree ("_order");
  CREATE INDEX "usage_fees_fee_categories_parent_id_idx" ON "usage_fees_fee_categories" USING btree ("_parent_id");
  CREATE INDEX "usage_fees_fee_categories_official_schedule_p_d_f_idx" ON "usage_fees_fee_categories" USING btree ("official_schedule_p_d_f_id");
  CREATE UNIQUE INDEX "usage_fees_fee_categories_locales_locale_parent_id_unique" ON "usage_fees_fee_categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "usage_fees__status_idx" ON "usage_fees" USING btree ("_status");
  CREATE UNIQUE INDEX "usage_fees_locales_locale_parent_id_unique" ON "usage_fees_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_usage_fees_v_version_fee_categories_order_idx" ON "_usage_fees_v_version_fee_categories" USING btree ("_order");
  CREATE INDEX "_usage_fees_v_version_fee_categories_parent_id_idx" ON "_usage_fees_v_version_fee_categories" USING btree ("_parent_id");
  CREATE INDEX "_usage_fees_v_version_fee_categories_official_schedule_p_idx" ON "_usage_fees_v_version_fee_categories" USING btree ("official_schedule_p_d_f_id");
  CREATE UNIQUE INDEX "_usage_fees_v_version_fee_categories_locales_locale_parent_i" ON "_usage_fees_v_version_fee_categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_usage_fees_v_version_version__status_idx" ON "_usage_fees_v" USING btree ("version__status");
  CREATE INDEX "_usage_fees_v_created_at_idx" ON "_usage_fees_v" USING btree ("created_at");
  CREATE INDEX "_usage_fees_v_updated_at_idx" ON "_usage_fees_v" USING btree ("updated_at");
  CREATE INDEX "_usage_fees_v_snapshot_idx" ON "_usage_fees_v" USING btree ("snapshot");
  CREATE INDEX "_usage_fees_v_published_locale_idx" ON "_usage_fees_v" USING btree ("published_locale");
  CREATE INDEX "_usage_fees_v_latest_idx" ON "_usage_fees_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_usage_fees_v_locales_locale_parent_id_unique" ON "_usage_fees_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "vip_lounge_amenities_order_idx" ON "vip_lounge_amenities" USING btree ("_order");
  CREATE INDEX "vip_lounge_amenities_parent_id_idx" ON "vip_lounge_amenities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "vip_lounge_amenities_locales_locale_parent_id_unique" ON "vip_lounge_amenities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "vip_lounge_lounge_images_order_idx" ON "vip_lounge_lounge_images" USING btree ("_order");
  CREATE INDEX "vip_lounge_lounge_images_parent_id_idx" ON "vip_lounge_lounge_images" USING btree ("_parent_id");
  CREATE INDEX "vip_lounge_lounge_images_image_idx" ON "vip_lounge_lounge_images" USING btree ("image_id");
  CREATE INDEX "vip_lounge__status_idx" ON "vip_lounge" USING btree ("_status");
  CREATE UNIQUE INDEX "vip_lounge_locales_locale_parent_id_unique" ON "vip_lounge_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_vip_lounge_v_version_amenities_order_idx" ON "_vip_lounge_v_version_amenities" USING btree ("_order");
  CREATE INDEX "_vip_lounge_v_version_amenities_parent_id_idx" ON "_vip_lounge_v_version_amenities" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_vip_lounge_v_version_amenities_locales_locale_parent_id_uni" ON "_vip_lounge_v_version_amenities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_vip_lounge_v_version_lounge_images_order_idx" ON "_vip_lounge_v_version_lounge_images" USING btree ("_order");
  CREATE INDEX "_vip_lounge_v_version_lounge_images_parent_id_idx" ON "_vip_lounge_v_version_lounge_images" USING btree ("_parent_id");
  CREATE INDEX "_vip_lounge_v_version_lounge_images_image_idx" ON "_vip_lounge_v_version_lounge_images" USING btree ("image_id");
  CREATE INDEX "_vip_lounge_v_version_version__status_idx" ON "_vip_lounge_v" USING btree ("version__status");
  CREATE INDEX "_vip_lounge_v_created_at_idx" ON "_vip_lounge_v" USING btree ("created_at");
  CREATE INDEX "_vip_lounge_v_updated_at_idx" ON "_vip_lounge_v" USING btree ("updated_at");
  CREATE INDEX "_vip_lounge_v_snapshot_idx" ON "_vip_lounge_v" USING btree ("snapshot");
  CREATE INDEX "_vip_lounge_v_published_locale_idx" ON "_vip_lounge_v" USING btree ("published_locale");
  CREATE INDEX "_vip_lounge_v_latest_idx" ON "_vip_lounge_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_vip_lounge_v_locales_locale_parent_id_unique" ON "_vip_lounge_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "emergency_services_service_contacts_order_idx" ON "emergency_services_service_contacts" USING btree ("_order");
  CREATE INDEX "emergency_services_service_contacts_parent_id_idx" ON "emergency_services_service_contacts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "emergency_services_service_contacts_locales_locale_parent_id" ON "emergency_services_service_contacts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "emergency_services__status_idx" ON "emergency_services" USING btree ("_status");
  CREATE UNIQUE INDEX "emergency_services_locales_locale_parent_id_unique" ON "emergency_services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_emergency_services_v_version_service_contacts_order_idx" ON "_emergency_services_v_version_service_contacts" USING btree ("_order");
  CREATE INDEX "_emergency_services_v_version_service_contacts_parent_id_idx" ON "_emergency_services_v_version_service_contacts" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_emergency_services_v_version_service_contacts_locales_local" ON "_emergency_services_v_version_service_contacts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_emergency_services_v_version_version__status_idx" ON "_emergency_services_v" USING btree ("version__status");
  CREATE INDEX "_emergency_services_v_created_at_idx" ON "_emergency_services_v" USING btree ("created_at");
  CREATE INDEX "_emergency_services_v_updated_at_idx" ON "_emergency_services_v" USING btree ("updated_at");
  CREATE INDEX "_emergency_services_v_snapshot_idx" ON "_emergency_services_v" USING btree ("snapshot");
  CREATE INDEX "_emergency_services_v_published_locale_idx" ON "_emergency_services_v" USING btree ("published_locale");
  CREATE INDEX "_emergency_services_v_latest_idx" ON "_emergency_services_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_emergency_services_v_locales_locale_parent_id_unique" ON "_emergency_services_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "working_hours_directions_op_hours_schedule_order_idx" ON "working_hours_directions_op_hours_schedule" USING btree ("_order");
  CREATE INDEX "working_hours_directions_op_hours_schedule_parent_id_idx" ON "working_hours_directions_op_hours_schedule" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "working_hours_directions_op_hours_schedule_locales_locale_pa" ON "working_hours_directions_op_hours_schedule_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "working_hours_directions_department_hours_order_idx" ON "working_hours_directions_department_hours" USING btree ("_order");
  CREATE INDEX "working_hours_directions_department_hours_parent_id_idx" ON "working_hours_directions_department_hours" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "working_hours_directions_department_hours_locales_locale_par" ON "working_hours_directions_department_hours_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "working_hours_directions_getting_here_order_idx" ON "working_hours_directions_getting_here" USING btree ("_order");
  CREATE INDEX "working_hours_directions_getting_here_parent_id_idx" ON "working_hours_directions_getting_here" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "working_hours_directions_getting_here_locales_locale_parent_" ON "working_hours_directions_getting_here_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "working_hours_directions__status_idx" ON "working_hours_directions" USING btree ("_status");
  CREATE UNIQUE INDEX "working_hours_directions_locales_locale_parent_id_unique" ON "working_hours_directions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_working_hours_directions_v_version_op_hours_schedule_order_idx" ON "_working_hours_directions_v_version_op_hours_schedule" USING btree ("_order");
  CREATE INDEX "_working_hours_directions_v_version_op_hours_schedule_parent_id_idx" ON "_working_hours_directions_v_version_op_hours_schedule" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_working_hours_directions_v_version_op_hours_schedule_locale" ON "_working_hours_directions_v_version_op_hours_schedule_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_working_hours_directions_v_version_department_hours_order_idx" ON "_working_hours_directions_v_version_department_hours" USING btree ("_order");
  CREATE INDEX "_working_hours_directions_v_version_department_hours_parent_id_idx" ON "_working_hours_directions_v_version_department_hours" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_working_hours_directions_v_version_department_hours_local_1" ON "_working_hours_directions_v_version_department_hours_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_working_hours_directions_v_version_getting_here_order_idx" ON "_working_hours_directions_v_version_getting_here" USING btree ("_order");
  CREATE INDEX "_working_hours_directions_v_version_getting_here_parent_id_idx" ON "_working_hours_directions_v_version_getting_here" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_working_hours_directions_v_version_getting_here_locales_loc" ON "_working_hours_directions_v_version_getting_here_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_working_hours_directions_v_version_version__status_idx" ON "_working_hours_directions_v" USING btree ("version__status");
  CREATE INDEX "_working_hours_directions_v_created_at_idx" ON "_working_hours_directions_v" USING btree ("created_at");
  CREATE INDEX "_working_hours_directions_v_updated_at_idx" ON "_working_hours_directions_v" USING btree ("updated_at");
  CREATE INDEX "_working_hours_directions_v_snapshot_idx" ON "_working_hours_directions_v" USING btree ("snapshot");
  CREATE INDEX "_working_hours_directions_v_published_locale_idx" ON "_working_hours_directions_v" USING btree ("published_locale");
  CREATE INDEX "_working_hours_directions_v_latest_idx" ON "_working_hours_directions_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_working_hours_directions_v_locales_locale_parent_id_unique" ON "_working_hours_directions_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "useful_links_link_groups_links_order_idx" ON "useful_links_link_groups_links" USING btree ("_order");
  CREATE INDEX "useful_links_link_groups_links_parent_id_idx" ON "useful_links_link_groups_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "useful_links_link_groups_links_locales_locale_parent_id_uniq" ON "useful_links_link_groups_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "useful_links_link_groups_order_idx" ON "useful_links_link_groups" USING btree ("_order");
  CREATE INDEX "useful_links_link_groups_parent_id_idx" ON "useful_links_link_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "useful_links_link_groups_locales_locale_parent_id_unique" ON "useful_links_link_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "useful_links__status_idx" ON "useful_links" USING btree ("_status");
  CREATE UNIQUE INDEX "useful_links_locales_locale_parent_id_unique" ON "useful_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_useful_links_v_version_link_groups_links_order_idx" ON "_useful_links_v_version_link_groups_links" USING btree ("_order");
  CREATE INDEX "_useful_links_v_version_link_groups_links_parent_id_idx" ON "_useful_links_v_version_link_groups_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_useful_links_v_version_link_groups_links_locales_locale_par" ON "_useful_links_v_version_link_groups_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_useful_links_v_version_link_groups_order_idx" ON "_useful_links_v_version_link_groups" USING btree ("_order");
  CREATE INDEX "_useful_links_v_version_link_groups_parent_id_idx" ON "_useful_links_v_version_link_groups" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_useful_links_v_version_link_groups_locales_locale_parent_id" ON "_useful_links_v_version_link_groups_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_useful_links_v_version_version__status_idx" ON "_useful_links_v" USING btree ("version__status");
  CREATE INDEX "_useful_links_v_created_at_idx" ON "_useful_links_v" USING btree ("created_at");
  CREATE INDEX "_useful_links_v_updated_at_idx" ON "_useful_links_v" USING btree ("updated_at");
  CREATE INDEX "_useful_links_v_snapshot_idx" ON "_useful_links_v" USING btree ("snapshot");
  CREATE INDEX "_useful_links_v_published_locale_idx" ON "_useful_links_v" USING btree ("published_locale");
  CREATE INDEX "_useful_links_v_latest_idx" ON "_useful_links_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_useful_links_v_locales_locale_parent_id_unique" ON "_useful_links_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "management_staff_management_team_order_idx" ON "management_staff_management_team" USING btree ("_order");
  CREATE INDEX "management_staff_management_team_parent_id_idx" ON "management_staff_management_team" USING btree ("_parent_id");
  CREATE INDEX "management_staff_management_team_photo_idx" ON "management_staff_management_team" USING btree ("photo_id");
  CREATE UNIQUE INDEX "management_staff_management_team_locales_locale_parent_id_un" ON "management_staff_management_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "management_staff_departments_order_idx" ON "management_staff_departments" USING btree ("_order");
  CREATE INDEX "management_staff_departments_parent_id_idx" ON "management_staff_departments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "management_staff_departments_locales_locale_parent_id_unique" ON "management_staff_departments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "management_staff__status_idx" ON "management_staff" USING btree ("_status");
  CREATE UNIQUE INDEX "management_staff_locales_locale_parent_id_unique" ON "management_staff_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_management_staff_v_version_management_team_order_idx" ON "_management_staff_v_version_management_team" USING btree ("_order");
  CREATE INDEX "_management_staff_v_version_management_team_parent_id_idx" ON "_management_staff_v_version_management_team" USING btree ("_parent_id");
  CREATE INDEX "_management_staff_v_version_management_team_photo_idx" ON "_management_staff_v_version_management_team" USING btree ("photo_id");
  CREATE UNIQUE INDEX "_management_staff_v_version_management_team_locales_locale_p" ON "_management_staff_v_version_management_team_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_management_staff_v_version_departments_order_idx" ON "_management_staff_v_version_departments" USING btree ("_order");
  CREATE INDEX "_management_staff_v_version_departments_parent_id_idx" ON "_management_staff_v_version_departments" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_management_staff_v_version_departments_locales_locale_paren" ON "_management_staff_v_version_departments_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_management_staff_v_version_version__status_idx" ON "_management_staff_v" USING btree ("version__status");
  CREATE INDEX "_management_staff_v_created_at_idx" ON "_management_staff_v" USING btree ("created_at");
  CREATE INDEX "_management_staff_v_updated_at_idx" ON "_management_staff_v" USING btree ("updated_at");
  CREATE INDEX "_management_staff_v_snapshot_idx" ON "_management_staff_v" USING btree ("snapshot");
  CREATE INDEX "_management_staff_v_published_locale_idx" ON "_management_staff_v" USING btree ("published_locale");
  CREATE INDEX "_management_staff_v_latest_idx" ON "_management_staff_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_management_staff_v_locales_locale_parent_id_unique" ON "_management_staff_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "legal_pages__status_idx" ON "legal_pages" USING btree ("_status");
  CREATE UNIQUE INDEX "legal_pages_locales_locale_parent_id_unique" ON "legal_pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_legal_pages_v_version_version__status_idx" ON "_legal_pages_v" USING btree ("version__status");
  CREATE INDEX "_legal_pages_v_created_at_idx" ON "_legal_pages_v" USING btree ("created_at");
  CREATE INDEX "_legal_pages_v_updated_at_idx" ON "_legal_pages_v" USING btree ("updated_at");
  CREATE INDEX "_legal_pages_v_snapshot_idx" ON "_legal_pages_v" USING btree ("snapshot");
  CREATE INDEX "_legal_pages_v_published_locale_idx" ON "_legal_pages_v" USING btree ("published_locale");
  CREATE INDEX "_legal_pages_v_latest_idx" ON "_legal_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_legal_pages_v_locales_locale_parent_id_unique" ON "_legal_pages_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "documents_locales" CASCADE;
  DROP TABLE "notices" CASCADE;
  DROP TABLE "notices_locales" CASCADE;
  DROP TABLE "notices_rels" CASCADE;
  DROP TABLE "_notices_v" CASCADE;
  DROP TABLE "_notices_v_locales" CASCADE;
  DROP TABLE "_notices_v_rels" CASCADE;
  DROP TABLE "pages_sections_bullets" CASCADE;
  DROP TABLE "pages_sections" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v_version_sections_bullets" CASCADE;
  DROP TABLE "_pages_v_version_sections" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "faqs_locales" CASCADE;
  DROP TABLE "airlines_destinations" CASCADE;
  DROP TABLE "airlines_destinations_locales" CASCADE;
  DROP TABLE "airlines" CASCADE;
  DROP TABLE "airlines_locales" CASCADE;
  DROP TABLE "_airlines_v_version_destinations" CASCADE;
  DROP TABLE "_airlines_v_version_destinations_locales" CASCADE;
  DROP TABLE "_airlines_v" CASCADE;
  DROP TABLE "_airlines_v_locales" CASCADE;
  DROP TABLE "news_events" CASCADE;
  DROP TABLE "news_events_locales" CASCADE;
  DROP TABLE "_news_events_v" CASCADE;
  DROP TABLE "_news_events_v_locales" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_social_links" CASCADE;
  DROP TABLE "site_settings_useful_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "home_page_services_preview" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "home_page_locales" CASCADE;
  DROP TABLE "passenger_guide_sections_bullets" CASCADE;
  DROP TABLE "passenger_guide_sections" CASCADE;
  DROP TABLE "passenger_guide_important_contacts" CASCADE;
  DROP TABLE "passenger_guide" CASCADE;
  DROP TABLE "passenger_guide_locales" CASCADE;
  DROP TABLE "transport_parking_sections_bullets" CASCADE;
  DROP TABLE "transport_parking_sections" CASCADE;
  DROP TABLE "transport_parking" CASCADE;
  DROP TABLE "transport_parking_locales" CASCADE;
  DROP TABLE "accessibility_info_sections_bullets" CASCADE;
  DROP TABLE "accessibility_info_sections" CASCADE;
  DROP TABLE "accessibility_info" CASCADE;
  DROP TABLE "accessibility_info_locales" CASCADE;
  DROP TABLE "airport_map_points" CASCADE;
  DROP TABLE "airport_map" CASCADE;
  DROP TABLE "airport_map_locales" CASCADE;
  DROP TABLE "contact_info_cards" CASCADE;
  DROP TABLE "contact_info" CASCADE;
  DROP TABLE "contact_info_locales" CASCADE;
  DROP TABLE "regulations_sections" CASCADE;
  DROP TABLE "regulations_sections_locales" CASCADE;
  DROP TABLE "regulations" CASCADE;
  DROP TABLE "regulations_locales" CASCADE;
  DROP TABLE "_regulations_v_version_sections" CASCADE;
  DROP TABLE "_regulations_v_version_sections_locales" CASCADE;
  DROP TABLE "_regulations_v" CASCADE;
  DROP TABLE "_regulations_v_locales" CASCADE;
  DROP TABLE "usage_fees_fee_categories" CASCADE;
  DROP TABLE "usage_fees_fee_categories_locales" CASCADE;
  DROP TABLE "usage_fees" CASCADE;
  DROP TABLE "usage_fees_locales" CASCADE;
  DROP TABLE "_usage_fees_v_version_fee_categories" CASCADE;
  DROP TABLE "_usage_fees_v_version_fee_categories_locales" CASCADE;
  DROP TABLE "_usage_fees_v" CASCADE;
  DROP TABLE "_usage_fees_v_locales" CASCADE;
  DROP TABLE "vip_lounge_amenities" CASCADE;
  DROP TABLE "vip_lounge_amenities_locales" CASCADE;
  DROP TABLE "vip_lounge_lounge_images" CASCADE;
  DROP TABLE "vip_lounge" CASCADE;
  DROP TABLE "vip_lounge_locales" CASCADE;
  DROP TABLE "_vip_lounge_v_version_amenities" CASCADE;
  DROP TABLE "_vip_lounge_v_version_amenities_locales" CASCADE;
  DROP TABLE "_vip_lounge_v_version_lounge_images" CASCADE;
  DROP TABLE "_vip_lounge_v" CASCADE;
  DROP TABLE "_vip_lounge_v_locales" CASCADE;
  DROP TABLE "emergency_services_service_contacts" CASCADE;
  DROP TABLE "emergency_services_service_contacts_locales" CASCADE;
  DROP TABLE "emergency_services" CASCADE;
  DROP TABLE "emergency_services_locales" CASCADE;
  DROP TABLE "_emergency_services_v_version_service_contacts" CASCADE;
  DROP TABLE "_emergency_services_v_version_service_contacts_locales" CASCADE;
  DROP TABLE "_emergency_services_v" CASCADE;
  DROP TABLE "_emergency_services_v_locales" CASCADE;
  DROP TABLE "working_hours_directions_op_hours_schedule" CASCADE;
  DROP TABLE "working_hours_directions_op_hours_schedule_locales" CASCADE;
  DROP TABLE "working_hours_directions_department_hours" CASCADE;
  DROP TABLE "working_hours_directions_department_hours_locales" CASCADE;
  DROP TABLE "working_hours_directions_getting_here" CASCADE;
  DROP TABLE "working_hours_directions_getting_here_locales" CASCADE;
  DROP TABLE "working_hours_directions" CASCADE;
  DROP TABLE "working_hours_directions_locales" CASCADE;
  DROP TABLE "_working_hours_directions_v_version_op_hours_schedule" CASCADE;
  DROP TABLE "_working_hours_directions_v_version_op_hours_schedule_locales" CASCADE;
  DROP TABLE "_working_hours_directions_v_version_department_hours" CASCADE;
  DROP TABLE "_working_hours_directions_v_version_department_hours_locales" CASCADE;
  DROP TABLE "_working_hours_directions_v_version_getting_here" CASCADE;
  DROP TABLE "_working_hours_directions_v_version_getting_here_locales" CASCADE;
  DROP TABLE "_working_hours_directions_v" CASCADE;
  DROP TABLE "_working_hours_directions_v_locales" CASCADE;
  DROP TABLE "useful_links_link_groups_links" CASCADE;
  DROP TABLE "useful_links_link_groups_links_locales" CASCADE;
  DROP TABLE "useful_links_link_groups" CASCADE;
  DROP TABLE "useful_links_link_groups_locales" CASCADE;
  DROP TABLE "useful_links" CASCADE;
  DROP TABLE "useful_links_locales" CASCADE;
  DROP TABLE "_useful_links_v_version_link_groups_links" CASCADE;
  DROP TABLE "_useful_links_v_version_link_groups_links_locales" CASCADE;
  DROP TABLE "_useful_links_v_version_link_groups" CASCADE;
  DROP TABLE "_useful_links_v_version_link_groups_locales" CASCADE;
  DROP TABLE "_useful_links_v" CASCADE;
  DROP TABLE "_useful_links_v_locales" CASCADE;
  DROP TABLE "management_staff_management_team" CASCADE;
  DROP TABLE "management_staff_management_team_locales" CASCADE;
  DROP TABLE "management_staff_departments" CASCADE;
  DROP TABLE "management_staff_departments_locales" CASCADE;
  DROP TABLE "management_staff" CASCADE;
  DROP TABLE "management_staff_locales" CASCADE;
  DROP TABLE "_management_staff_v_version_management_team" CASCADE;
  DROP TABLE "_management_staff_v_version_management_team_locales" CASCADE;
  DROP TABLE "_management_staff_v_version_departments" CASCADE;
  DROP TABLE "_management_staff_v_version_departments_locales" CASCADE;
  DROP TABLE "_management_staff_v" CASCADE;
  DROP TABLE "_management_staff_v_locales" CASCADE;
  DROP TABLE "legal_pages" CASCADE;
  DROP TABLE "legal_pages_locales" CASCADE;
  DROP TABLE "_legal_pages_v" CASCADE;
  DROP TABLE "_legal_pages_v_locales" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_media_media_category";
  DROP TYPE "public"."enum_documents_document_type";
  DROP TYPE "public"."enum_notices_category";
  DROP TYPE "public"."enum_notices_status";
  DROP TYPE "public"."enum__notices_v_version_category";
  DROP TYPE "public"."enum__notices_v_version_status";
  DROP TYPE "public"."enum__notices_v_published_locale";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum_faqs_category";
  DROP TYPE "public"."enum_faqs_status";
  DROP TYPE "public"."enum_airlines_status";
  DROP TYPE "public"."enum__airlines_v_version_status";
  DROP TYPE "public"."enum__airlines_v_published_locale";
  DROP TYPE "public"."enum_news_events_type";
  DROP TYPE "public"."enum_news_events_status";
  DROP TYPE "public"."enum__news_events_v_version_type";
  DROP TYPE "public"."enum__news_events_v_version_status";
  DROP TYPE "public"."enum__news_events_v_published_locale";
  DROP TYPE "public"."enum_regulations_status";
  DROP TYPE "public"."enum__regulations_v_version_status";
  DROP TYPE "public"."enum__regulations_v_published_locale";
  DROP TYPE "public"."enum_usage_fees_status";
  DROP TYPE "public"."enum__usage_fees_v_version_status";
  DROP TYPE "public"."enum__usage_fees_v_published_locale";
  DROP TYPE "public"."enum_vip_lounge_status";
  DROP TYPE "public"."enum__vip_lounge_v_version_status";
  DROP TYPE "public"."enum__vip_lounge_v_published_locale";
  DROP TYPE "public"."enum_emergency_services_status";
  DROP TYPE "public"."enum__emergency_services_v_version_status";
  DROP TYPE "public"."enum__emergency_services_v_published_locale";
  DROP TYPE "public"."enum_working_hours_directions_status";
  DROP TYPE "public"."enum__working_hours_directions_v_version_status";
  DROP TYPE "public"."enum__working_hours_directions_v_published_locale";
  DROP TYPE "public"."enum_useful_links_status";
  DROP TYPE "public"."enum__useful_links_v_version_status";
  DROP TYPE "public"."enum__useful_links_v_published_locale";
  DROP TYPE "public"."enum_management_staff_status";
  DROP TYPE "public"."enum__management_staff_v_version_status";
  DROP TYPE "public"."enum__management_staff_v_published_locale";
  DROP TYPE "public"."enum_legal_pages_status";
  DROP TYPE "public"."enum__legal_pages_v_version_status";
  DROP TYPE "public"."enum__legal_pages_v_published_locale";`)
}
