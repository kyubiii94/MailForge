CREATE TABLE "brand_dnas" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"site_url" text NOT NULL,
	"typography" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"colors" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"editorial_tone" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"visual_style" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"keywords" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_validated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"client_id" text NOT NULL,
	"brand_dna_id" text DEFAULT '' NOT NULL,
	"name" text NOT NULL,
	"trigger" text,
	"objective" text,
	"period" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"text_source" text,
	"visual_source" text,
	"design_mode" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"sector" text NOT NULL,
	"positioning" text DEFAULT '' NOT NULL,
	"website" text,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"distribution" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tone_of_voice" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"technical_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_designs" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"variant_number" integer DEFAULT 1 NOT NULL,
	"html_content" text DEFAULT '' NOT NULL,
	"mjml_source" text DEFAULT '' NOT NULL,
	"thumbnail_url" text DEFAULT '' NOT NULL,
	"deliverability_score" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "text_contents" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"subject" text DEFAULT '' NOT NULL,
	"preheader" text DEFAULT '' NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"cta_text" text DEFAULT '' NOT NULL,
	"cta_url" text DEFAULT '' NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visuals" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"file_url" text NOT NULL,
	"file_key" text DEFAULT '' NOT NULL,
	"original_filename" text DEFAULT '' NOT NULL,
	"width" integer DEFAULT 0 NOT NULL,
	"height" integer DEFAULT 0 NOT NULL,
	"file_size" integer DEFAULT 0 NOT NULL,
	"alt_text" text DEFAULT '' NOT NULL,
	"source_type" text DEFAULT 'uploaded' NOT NULL,
	"is_selected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" text DEFAULT 'default-user' NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_dnas" ADD CONSTRAINT "brand_dnas_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_dnas" ADD CONSTRAINT "brand_dnas_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_designs" ADD CONSTRAINT "email_designs_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "text_contents" ADD CONSTRAINT "text_contents_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visuals" ADD CONSTRAINT "visuals_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;