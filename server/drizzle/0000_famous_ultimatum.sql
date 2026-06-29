CREATE TABLE "recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"video_key" text NOT NULL,
	"video_url" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" text NOT NULL,
	"problem" text NOT NULL,
	"skill" text,
	"difficulty" text,
	"correct_answer" integer,
	"solved" boolean DEFAULT false,
	"attempt_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
