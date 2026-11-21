import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase3AdvancedFeatures1795280208924 implements MigrationInterface {
    name = 'Phase3AdvancedFeatures1795280208924'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Legacy IT-security alert types are mapped to `system` (compliance is kept) by the USING clause of the alert.type conversion below.
        await queryRunner.query(`CREATE TABLE "conversation" ("id" SERIAL NOT NULL, "subject" character varying(200) NOT NULL, "createdById" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_864528ec4274360a40f66c29845" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "conversation_participant" ("id" SERIAL NOT NULL, "conversationId" integer NOT NULL, "userId" integer NOT NULL, "lastReadAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_conversation_participant" UNIQUE ("conversationId", "userId"), CONSTRAINT "PK_326cbb9ee8891f8e29157bda911" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dd90174e375c888d7f431cf829" ON "conversation_participant" ("userId") `);
        await queryRunner.query(`CREATE TABLE "conversation_message" ("id" SERIAL NOT NULL, "conversationId" integer NOT NULL, "senderId" integer, "body" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2f8286c3560b52dba8428ac182e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_508365cedcaf5e96e67745012a" ON "conversation_message" ("conversationId", "createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."corrective_action_sourcetype_enum" AS ENUM('incident', 'risk', 'audit')`);
        await queryRunner.query(`CREATE TYPE "public"."corrective_action_status_enum" AS ENUM('todo', 'in_progress', 'done', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "corrective_action" ("id" SERIAL NOT NULL, "sourceType" "public"."corrective_action_sourcetype_enum" NOT NULL, "sourceId" integer NOT NULL, "title" character varying(200) NOT NULL, "description" text, "ownerId" integer, "dueDate" TIMESTAMP WITH TIME ZONE, "status" "public"."corrective_action_status_enum" NOT NULL DEFAULT 'todo', "doneAt" TIMESTAMP WITH TIME ZONE, "createdById" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3cb01798ab5a10097eb0d0fc6fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_43f9af231cb7f43158155622ba" ON "corrective_action" ("ownerId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_81ac9b7d969f2c97e283574f27" ON "corrective_action" ("sourceType", "sourceId") `);
        await queryRunner.query(`ALTER TABLE "incident" ADD "gravity" integer`);
        await queryRunner.query(`ALTER TABLE "incident" ADD "probability" integer`);
        await queryRunner.query(`ALTER TABLE "incident" ADD "riskScore" integer`);
        await queryRunner.query(`ALTER TABLE "incident" ADD "rootCause" text`);
        await queryRunner.query(`CREATE TYPE "public"."incident_evaluatedseverity_enum" AS ENUM('low', 'medium', 'high', 'critical')`);
        await queryRunner.query(`ALTER TABLE "incident" ADD "evaluatedSeverity" "public"."incident_evaluatedseverity_enum"`);
        await queryRunner.query(`ALTER TABLE "incident" ADD "evaluatedById" integer`);
        await queryRunner.query(`ALTER TABLE "incident" ADD "evaluatedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TYPE "public"."alert_type_enum" RENAME TO "alert_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_type_enum" AS ENUM('incident_spike', 'critical_incident', 'stock', 'maintenance', 'training', 'emergency', 'compliance', 'risk', 'system')`);
        await queryRunner.query(`ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."alert_type_enum" USING (CASE "type"::"text" WHEN 'compliance' THEN 'compliance' ELSE 'system' END)::"public"."alert_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."alert_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "incident" ADD CONSTRAINT "FK_fe76298aad3012c6ea319823e4a" FOREIGN KEY ("evaluatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation" ADD CONSTRAINT "FK_c681529d2e6afa4aed28ef53b08" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participant" ADD CONSTRAINT "FK_b1a75fd6cdb0ab0a82c5b01c34f" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participant" ADD CONSTRAINT "FK_dd90174e375c888d7f431cf829e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_message" ADD CONSTRAINT "FK_b15f4550c3629ec9002803cfe20" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_message" ADD CONSTRAINT "FK_82d6ff942939ab9b121c9cc3203" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "corrective_action" ADD CONSTRAINT "FK_7a4724f813aaa53910637c1b58a" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "corrective_action" ADD CONSTRAINT "FK_cf1b39cc8d8629f46a847ef4ae5" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "corrective_action" DROP CONSTRAINT "FK_cf1b39cc8d8629f46a847ef4ae5"`);
        await queryRunner.query(`ALTER TABLE "corrective_action" DROP CONSTRAINT "FK_7a4724f813aaa53910637c1b58a"`);
        await queryRunner.query(`ALTER TABLE "conversation_message" DROP CONSTRAINT "FK_82d6ff942939ab9b121c9cc3203"`);
        await queryRunner.query(`ALTER TABLE "conversation_message" DROP CONSTRAINT "FK_b15f4550c3629ec9002803cfe20"`);
        await queryRunner.query(`ALTER TABLE "conversation_participant" DROP CONSTRAINT "FK_dd90174e375c888d7f431cf829e"`);
        await queryRunner.query(`ALTER TABLE "conversation_participant" DROP CONSTRAINT "FK_b1a75fd6cdb0ab0a82c5b01c34f"`);
        await queryRunner.query(`ALTER TABLE "conversation" DROP CONSTRAINT "FK_c681529d2e6afa4aed28ef53b08"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP CONSTRAINT "FK_fe76298aad3012c6ea319823e4a"`);
        await queryRunner.query(`CREATE TYPE "public"."alert_type_enum_old" AS ENUM('security', 'system', 'network', 'user_activity', 'compliance', 'performance')`);
        await queryRunner.query(`ALTER TABLE "alert" ALTER COLUMN "type" TYPE "public"."alert_type_enum_old" USING (CASE "type"::"text" WHEN 'compliance' THEN 'compliance' ELSE 'system' END)::"public"."alert_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."alert_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."alert_type_enum_old" RENAME TO "alert_type_enum"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "evaluatedAt"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "evaluatedById"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "evaluatedSeverity"`);
        await queryRunner.query(`DROP TYPE "public"."incident_evaluatedseverity_enum"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "rootCause"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "riskScore"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "probability"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "gravity"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_81ac9b7d969f2c97e283574f27"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_43f9af231cb7f43158155622ba"`);
        await queryRunner.query(`DROP TABLE "corrective_action"`);
        await queryRunner.query(`DROP TYPE "public"."corrective_action_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."corrective_action_sourcetype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_508365cedcaf5e96e67745012a"`);
        await queryRunner.query(`DROP TABLE "conversation_message"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dd90174e375c888d7f431cf829"`);
        await queryRunner.query(`DROP TABLE "conversation_participant"`);
        await queryRunner.query(`DROP TABLE "conversation"`);
    }

}
