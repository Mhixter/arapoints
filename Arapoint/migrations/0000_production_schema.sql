CREATE TABLE "admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" varchar(255) NOT NULL,
	"setting_value" text,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "airtime_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"network" varchar(50),
	"phone_number" varchar(20),
	"amount" numeric(10, 2),
	"type" varchar(50),
	"transaction_id" varchar(100),
	"status" varchar(50),
	"reference" varchar(100),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "airtime_services_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "birth_attestations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"full_name" varchar(255),
	"date_of_birth" date,
	"registration_number" varchar(100),
	"status" varchar(50),
	"certificate_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bot_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" varchar(100) NOT NULL,
	"username" varchar(255),
	"password_hash" varchar(255),
	"api_key" varchar(500),
	"auth_token" varchar(1000),
	"token_expiry" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bot_credentials_service_name_unique" UNIQUE("service_name")
);
--> statement-breakpoint
CREATE TABLE "bvn_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"bvn" varchar(11),
	"phone" varchar(20),
	"service_type" varchar(50),
	"request_id" varchar(100),
	"status" varchar(50),
	"response_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bvn_services_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
CREATE TABLE "cable_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"provider" varchar(100),
	"smartcard_number" varchar(50),
	"package" varchar(100),
	"amount" numeric(10, 2),
	"transaction_id" varchar(100),
	"status" varchar(50),
	"reference" varchar(100),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "cable_services_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "data_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"network" varchar(50),
	"phone_number" varchar(20),
	"plan_name" varchar(100),
	"amount" numeric(10, 2),
	"type" varchar(50),
	"transaction_id" varchar(100),
	"status" varchar(50),
	"reference" varchar(100),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "data_services_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "education_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"service_type" varchar(100) NOT NULL,
	"exam_year" integer,
	"registration_number" varchar(100),
	"status" varchar(50),
	"result_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "electricity_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"disco_name" varchar(100),
	"meter_number" varchar(50),
	"amount" numeric(10, 2),
	"transaction_id" varchar(100),
	"status" varchar(50),
	"reference" varchar(100),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "electricity_services_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "identity_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"verification_type" varchar(100),
	"nin" varchar(11),
	"phone" varchar(20),
	"second_enrollment_id" varchar(100),
	"status" varchar(50),
	"verification_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rpa_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"service_type" varchar(100) NOT NULL,
	"query_data" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"result" jsonb,
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"max_retries" integer DEFAULT 3,
	"priority" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"transaction_type" varchar(50),
	"amount" numeric(15, 2),
	"payment_method" varchar(50),
	"reference_id" varchar(100),
	"status" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password_hash" varchar(255),
	"wallet_balance" numeric(15, 2) DEFAULT '0',
	"bvn" varchar(11),
	"nin" varchar(11),
	"kyc_status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "airtime_services" ADD CONSTRAINT "airtime_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "birth_attestations" ADD CONSTRAINT "birth_attestations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bvn_services" ADD CONSTRAINT "bvn_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cable_services" ADD CONSTRAINT "cable_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_services" ADD CONSTRAINT "data_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "education_services" ADD CONSTRAINT "education_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "electricity_services" ADD CONSTRAINT "electricity_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verifications" ADD CONSTRAINT "identity_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rpa_jobs" ADD CONSTRAINT "rpa_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;