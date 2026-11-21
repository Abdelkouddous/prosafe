import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1795278357168 implements MigrationInterface {
    name = 'Init1795278357168'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."task_status_enum" AS ENUM('pending', 'in_progress', 'completed')`);
        await queryRunner.query(`CREATE TABLE "task" ("id" SERIAL NOT NULL, "title" character varying(100) NOT NULL, "description" character varying(500) NOT NULL, "status" "public"."task_status_enum" NOT NULL DEFAULT 'pending', "priority" character varying(10) NOT NULL DEFAULT 'Low', "isCompleted" boolean NOT NULL DEFAULT false, "dueDate" TIMESTAMP, "startDate" TIMESTAMP, "location" character varying(200), "maxParticipants" integer, "currentParticipants" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."alert_severity_enum" AS ENUM('low', 'medium', 'high', 'critical')`);
        await queryRunner.query(`CREATE TYPE "public"."alert_status_enum" AS ENUM('unresolved', 'investigating', 'resolved', 'dismissed')`);
        await queryRunner.query(`CREATE TYPE "public"."alert_type_enum" AS ENUM('security', 'system', 'network', 'user_activity', 'compliance', 'performance')`);
        await queryRunner.query(`CREATE TABLE "alert" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "severity" "public"."alert_severity_enum" NOT NULL DEFAULT 'low', "status" "public"."alert_status_enum" NOT NULL DEFAULT 'unresolved', "type" "public"."alert_type_enum" NOT NULL, "source_ip" character varying, "affected_user_id" integer, "resolved_by_id" integer, "resolved_at" TIMESTAMP, "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ad91cad659a3536465d564a4b2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."incident_type_enum" AS ENUM('safety', 'security', 'hr_violation')`);
        await queryRunner.query(`CREATE TYPE "public"."incident_severity_enum" AS ENUM('low', 'medium', 'high', 'critical')`);
        await queryRunner.query(`CREATE TYPE "public"."incident_status_enum" AS ENUM('open', 'resolved', 'investigating', 'closed')`);
        await queryRunner.query(`CREATE TABLE "incident" ("id" SERIAL NOT NULL, "incidentId" character varying NOT NULL, "photo" bytea, "photoHash" character varying(64), "description" character varying(200), "type" "public"."incident_type_enum" NOT NULL, "severity" "public"."incident_severity_enum" NOT NULL, "timestamp" TIMESTAMP NOT NULL, "reportedBy" integer NOT NULL, "status" "public"."incident_status_enum" NOT NULL DEFAULT 'open', "geoLatitude" numeric(10,8), "geoLongitude" numeric(11,8), "manualAddress" character varying(200), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "resolvedAt" TIMESTAMP, "resolvedBy" integer, CONSTRAINT "UQ_35cfee23fed50bed186f2a3439e" UNIQUE ("incidentId"), CONSTRAINT "PK_5f90b28b0b8238d89ee8edcf96e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a0c5f69533fa91f2218cd16ebf" ON "incident" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_ac8dfb2f2a1e94f35ac9dadf3f" ON "incident" ("geoLatitude", "geoLongitude") `);
        await queryRunner.query(`CREATE TYPE "public"."inventory_item_category_enum" AS ENUM('electronics', 'office_supplies', 'furniture', 'safety_equipment', 'tools', 'consumables', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_item_status_enum" AS ENUM('active', 'inactive', 'out_of_stock', 'discontinued', 'low_stock')`);
        await queryRunner.query(`CREATE TABLE "inventory_item" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "sku" character varying, "description" text NOT NULL, "price" numeric(10,5) NOT NULL DEFAULT '0', "quantity" integer NOT NULL, "min_stock_level" integer NOT NULL, "category" "public"."inventory_item_category_enum" NOT NULL, "status" "public"."inventory_item_status_enum" NOT NULL DEFAULT 'active', "supplier" character varying, "location" character varying, "created_by_id" integer, "updated_by_id" integer, "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94f5cbcb5f280f2f30bd4a9fd90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."message_status_enum" AS ENUM('unread', 'read', 'archived')`);
        await queryRunner.query(`CREATE TABLE "message" ("id" SERIAL NOT NULL, "subject" character varying NOT NULL, "content" text NOT NULL, "sender_id" integer, "system_sender" character varying, "recipient_id" integer, "status" "public"."message_status_enum" NOT NULL DEFAULT 'unread', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "is_urgent" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "firstName" character varying, "lastName" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "emailVerified" boolean NOT NULL DEFAULT false, "roles" text NOT NULL DEFAULT 'pending', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reward" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "incidentId" character varying, "points" integer NOT NULL DEFAULT '0', "reason" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_4cadb9a7f85c194c89a6a169e87" UNIQUE ("incidentId"), CONSTRAINT "PK_a90ea606c229e380fb341838036" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "email_verification" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "consumed" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_b985a8362d9dac51e3d6120d40e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_dfd82813f24e0ba651daa7eb93" ON "email_verification" ("token") `);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_91d76dd2ae372b9b7dfb6bf3fd2" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert" ADD CONSTRAINT "FK_70f6712c5ecb11a181edfa81c2a" FOREIGN KEY ("affected_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alert" ADD CONSTRAINT "FK_509880e675f9e6e5940ca71253e" FOREIGN KEY ("resolved_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_f71254d6053d609072c40537be9" FOREIGN KEY ("reportedBy") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_6b2dc1943e6ba70adfc7735ba0b" FOREIGN KEY ("resolvedBy") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_item" ADD CONSTRAINT "FK_68cd306c674be51367834d5fc94" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_item" ADD CONSTRAINT "FK_d50734c0e1cf1f493df9fbe1729" FOREIGN KEY ("updated_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_c0ab99d9dfc61172871277b52f6" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "message" ADD CONSTRAINT "FK_3318a3c87e7795d769d5b96e564" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reward" ADD CONSTRAINT "FK_ddce579c4f227f34c959fa6daf9" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_verification" ADD CONSTRAINT "FK_e7eb5e3c3dd984d69f6eb1cdf1c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_verification" DROP CONSTRAINT "FK_e7eb5e3c3dd984d69f6eb1cdf1c"`);
        await queryRunner.query(`ALTER TABLE "reward" DROP CONSTRAINT "FK_ddce579c4f227f34c959fa6daf9"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_3318a3c87e7795d769d5b96e564"`);
        await queryRunner.query(`ALTER TABLE "message" DROP CONSTRAINT "FK_c0ab99d9dfc61172871277b52f6"`);
        await queryRunner.query(`ALTER TABLE "inventory_item" DROP CONSTRAINT "FK_d50734c0e1cf1f493df9fbe1729"`);
        await queryRunner.query(`ALTER TABLE "inventory_item" DROP CONSTRAINT "FK_68cd306c674be51367834d5fc94"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_6b2dc1943e6ba70adfc7735ba0b"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_f71254d6053d609072c40537be9"`);
        await queryRunner.query(`ALTER TABLE "alert" DROP CONSTRAINT "FK_509880e675f9e6e5940ca71253e"`);
        await queryRunner.query(`ALTER TABLE "alert" DROP CONSTRAINT "FK_70f6712c5ecb11a181edfa81c2a"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_91d76dd2ae372b9b7dfb6bf3fd2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dfd82813f24e0ba651daa7eb93"`);
        await queryRunner.query(`DROP TABLE "email_verification"`);
        await queryRunner.query(`DROP TABLE "reward"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "message"`);
        await queryRunner.query(`DROP TYPE "public"."message_status_enum"`);
        await queryRunner.query(`DROP TABLE "inventory_item"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_item_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_item_category_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac8dfb2f2a1e94f35ac9dadf3f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0c5f69533fa91f2218cd16ebf"`);
        await queryRunner.query(`DROP TABLE "incident"`);
        await queryRunner.query(`DROP TYPE "public"."incident_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."incident_severity_enum"`);
        await queryRunner.query(`DROP TYPE "public"."incident_type_enum"`);
        await queryRunner.query(`DROP TABLE "alert"`);
        await queryRunner.query(`DROP TYPE "public"."alert_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."alert_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."alert_severity_enum"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TYPE "public"."task_status_enum"`);
    }

}
