import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase4RisksAuditsEmergencyFeedback1795280949142 implements MigrationInterface {
    name = 'Phase4RisksAuditsEmergencyFeedback1795280949142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."action_plan_status_enum" AS ENUM('planned', 'in_progress', 'completed', 'validated')`);
        await queryRunner.query(`CREATE TABLE "action_plan" ("id" SERIAL NOT NULL, "riskId" integer NOT NULL, "title" character varying(200) NOT NULL, "description" text, "ownerId" integer, "dueDate" TIMESTAMP WITH TIME ZONE, "status" "public"."action_plan_status_enum" NOT NULL DEFAULT 'planned', "progress" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_73de59f4ddad48bad469c1afdbd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_787089ec459a4371eebe09625b" ON "action_plan" ("riskId", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."risk_level_enum" AS ENUM('low', 'medium', 'high', 'critical')`);
        await queryRunner.query(`CREATE TYPE "public"."risk_status_enum" AS ENUM('proposed', 'validated', 'mitigated', 'archived')`);
        await queryRunner.query(`CREATE TABLE "risk" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "description" text, "hazardCategory" character varying(100) NOT NULL, "zone" character varying(100), "department" character varying(100), "gravity" integer NOT NULL, "probability" integer NOT NULL, "score" integer NOT NULL, "level" "public"."risk_level_enum" NOT NULL, "recommendedMeasures" text, "status" "public"."risk_status_enum" NOT NULL DEFAULT 'proposed', "proposedById" integer, "validatedById" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_955c5a23813b1704181c9a5f7c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ccf6b7c292e60dee21c3c8b4a2" ON "risk" ("status", "level") `);
        await queryRunner.query(`CREATE TYPE "public"."lmra_assessment_decision_enum" AS ENUM('go', 'stop')`);
        await queryRunner.query(`CREATE TABLE "lmra_assessment" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "task" character varying(200) NOT NULL, "location" character varying(200), "hazards" jsonb NOT NULL DEFAULT '[]', "decision" "public"."lmra_assessment_decision_enum" NOT NULL, "comments" text, "riskIds" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_393a6aade5e864d650ba98d59e0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."feedback_category_enum" AS ENUM('bug', 'suggestion', 'usability', 'other')`);
        await queryRunner.query(`CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "userId" integer, "rating" integer NOT NULL, "category" "public"."feedback_category_enum" NOT NULL DEFAULT 'other', "comment" text, "appVersion" character varying(30), "platform" character varying(30), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_59a7946f56cddfd6f80fafda48" ON "feedback" ("createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."emergency_scenario_type_enum" AS ENUM('fire', 'evacuation', 'chemical', 'injury', 'earthquake', 'gas_leak', 'other')`);
        await queryRunner.query(`CREATE TABLE "emergency_scenario" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "type" "public"."emergency_scenario_type_enum" NOT NULL DEFAULT 'other', "steps" jsonb NOT NULL DEFAULT '[]', "contacts" jsonb NOT NULL DEFAULT '[]', "assemblyPoint" character varying(200), "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f75a1a8b71823dbba15534287a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "emergency_event" ("id" SERIAL NOT NULL, "scenarioId" integer, "message" text NOT NULL, "zone" character varying(100), "triggeredById" integer, "triggeredAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "closedAt" TIMESTAMP WITH TIME ZONE, "closedById" integer, "active" boolean NOT NULL DEFAULT true, "alertId" integer, CONSTRAINT "PK_7725ca3baa5ebc79c464209fc20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97d6c05f2396170345c028d3d5" ON "emergency_event" ("active") `);
        await queryRunner.query(`CREATE TYPE "public"."drill_status_enum" AS ENUM('planned', 'done', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "drill" ("id" SERIAL NOT NULL, "scenarioId" integer, "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL, "zone" character varying(100), "status" "public"."drill_status_enum" NOT NULL DEFAULT 'planned', "durationSeconds" integer, "participantsCount" integer, "evacuatedCount" integer, "observations" text, "createdById" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_66c24774414aa39260e1c6c286f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audit_response_result_enum" AS ENUM('conform', 'non_conform', 'not_applicable')`);
        await queryRunner.query(`CREATE TABLE "audit_response" ("id" SERIAL NOT NULL, "auditId" integer NOT NULL, "itemId" integer NOT NULL, "result" "public"."audit_response_result_enum" NOT NULL, "comment" text, "evidenceFileId" integer, "correctiveActionId" integer, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_1da74e5ca7b64e4721fccc865fd" UNIQUE ("auditId", "itemId"), CONSTRAINT "PK_885a1430ab5de805cfb5ae5e8d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "checklist_template" ("id" SERIAL NOT NULL, "name" character varying(200) NOT NULL, "standard" character varying(100) NOT NULL, "items" jsonb NOT NULL DEFAULT '[]', "createdById" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_894b21b07d6fa016cfbf2dba947" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."audit_type_enum" AS ENUM('internal', 'external')`);
        await queryRunner.query(`CREATE TYPE "public"."audit_status_enum" AS ENUM('planned', 'in_progress', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "audit" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "type" "public"."audit_type_enum" NOT NULL DEFAULT 'internal', "standard" character varying(100) NOT NULL, "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL, "auditorName" character varying(200), "auditorId" integer, "zone" character varying(100), "status" "public"."audit_status_enum" NOT NULL DEFAULT 'planned', "score" double precision, "templateId" integer, "completedAt" TIMESTAMP WITH TIME ZONE, "createdById" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1d3d120ddaf7bc9b1ed68ed463a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5a4d05facc43c8c047437f20a2" ON "audit" ("scheduledAt") `);
        await queryRunner.query(`CREATE TYPE "public"."compliance_document_type_enum" AS ENUM('audit_report', 'certificate', 'procedure', 'policy', 'other')`);
        await queryRunner.query(`CREATE TABLE "compliance_document" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "type" "public"."compliance_document_type_enum" NOT NULL DEFAULT 'other', "fileId" integer NOT NULL, "validUntil" date, "auditId" integer, "uploadedById" integer, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_53e9d82ee9589ce65889ad12005" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "action_plan" ADD CONSTRAINT "FK_b5f8d9bc6b8f6baebfd3be5407c" FOREIGN KEY ("riskId") REFERENCES "risk"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "action_plan" ADD CONSTRAINT "FK_24340d0a7f5c30e0e8550f0fc2f" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "risk" ADD CONSTRAINT "FK_dc4fc6461cb40622db705eb3d18" FOREIGN KEY ("proposedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "risk" ADD CONSTRAINT "FK_80763e1ada74a9987bc747da66d" FOREIGN KEY ("validatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lmra_assessment" ADD CONSTRAINT "FK_ffb01e10abcfd263ee5fa91337e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedback" ADD CONSTRAINT "FK_4a39e6ac0cecdf18307a365cf3c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "emergency_event" ADD CONSTRAINT "FK_3c2f685d70121a9d50f271a66ca" FOREIGN KEY ("scenarioId") REFERENCES "emergency_scenario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "emergency_event" ADD CONSTRAINT "FK_647e54e39363a840fbef1dd5bbf" FOREIGN KEY ("triggeredById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "drill" ADD CONSTRAINT "FK_18033017e658b8d372348a2d555" FOREIGN KEY ("scenarioId") REFERENCES "emergency_scenario"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_response" ADD CONSTRAINT "FK_d804cb00b7265aa30e8fdc43374" FOREIGN KEY ("auditId") REFERENCES "audit"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_response" ADD CONSTRAINT "FK_f308949db75df0eaafbfa30b43d" FOREIGN KEY ("evidenceFileId") REFERENCES "stored_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit" ADD CONSTRAINT "FK_0987d3393d713c44c3d0f5d631c" FOREIGN KEY ("auditorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit" ADD CONSTRAINT "FK_aacd46931c9dc22618216ed150f" FOREIGN KEY ("templateId") REFERENCES "checklist_template"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compliance_document" ADD CONSTRAINT "FK_764d27ca26b1b5da0db04bb90b7" FOREIGN KEY ("fileId") REFERENCES "stored_file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compliance_document" ADD CONSTRAINT "FK_255d78e7bcf80510e2aa6e2b56c" FOREIGN KEY ("auditId") REFERENCES "audit"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "compliance_document" DROP CONSTRAINT "FK_255d78e7bcf80510e2aa6e2b56c"`);
        await queryRunner.query(`ALTER TABLE "compliance_document" DROP CONSTRAINT "FK_764d27ca26b1b5da0db04bb90b7"`);
        await queryRunner.query(`ALTER TABLE "audit" DROP CONSTRAINT "FK_aacd46931c9dc22618216ed150f"`);
        await queryRunner.query(`ALTER TABLE "audit" DROP CONSTRAINT "FK_0987d3393d713c44c3d0f5d631c"`);
        await queryRunner.query(`ALTER TABLE "audit_response" DROP CONSTRAINT "FK_f308949db75df0eaafbfa30b43d"`);
        await queryRunner.query(`ALTER TABLE "audit_response" DROP CONSTRAINT "FK_d804cb00b7265aa30e8fdc43374"`);
        await queryRunner.query(`ALTER TABLE "drill" DROP CONSTRAINT "FK_18033017e658b8d372348a2d555"`);
        await queryRunner.query(`ALTER TABLE "emergency_event" DROP CONSTRAINT "FK_647e54e39363a840fbef1dd5bbf"`);
        await queryRunner.query(`ALTER TABLE "emergency_event" DROP CONSTRAINT "FK_3c2f685d70121a9d50f271a66ca"`);
        await queryRunner.query(`ALTER TABLE "feedback" DROP CONSTRAINT "FK_4a39e6ac0cecdf18307a365cf3c"`);
        await queryRunner.query(`ALTER TABLE "lmra_assessment" DROP CONSTRAINT "FK_ffb01e10abcfd263ee5fa91337e"`);
        await queryRunner.query(`ALTER TABLE "risk" DROP CONSTRAINT "FK_80763e1ada74a9987bc747da66d"`);
        await queryRunner.query(`ALTER TABLE "risk" DROP CONSTRAINT "FK_dc4fc6461cb40622db705eb3d18"`);
        await queryRunner.query(`ALTER TABLE "action_plan" DROP CONSTRAINT "FK_24340d0a7f5c30e0e8550f0fc2f"`);
        await queryRunner.query(`ALTER TABLE "action_plan" DROP CONSTRAINT "FK_b5f8d9bc6b8f6baebfd3be5407c"`);
        await queryRunner.query(`DROP TABLE "compliance_document"`);
        await queryRunner.query(`DROP TYPE "public"."compliance_document_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a4d05facc43c8c047437f20a2"`);
        await queryRunner.query(`DROP TABLE "audit"`);
        await queryRunner.query(`DROP TYPE "public"."audit_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."audit_type_enum"`);
        await queryRunner.query(`DROP TABLE "checklist_template"`);
        await queryRunner.query(`DROP TABLE "audit_response"`);
        await queryRunner.query(`DROP TYPE "public"."audit_response_result_enum"`);
        await queryRunner.query(`DROP TABLE "drill"`);
        await queryRunner.query(`DROP TYPE "public"."drill_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97d6c05f2396170345c028d3d5"`);
        await queryRunner.query(`DROP TABLE "emergency_event"`);
        await queryRunner.query(`DROP TABLE "emergency_scenario"`);
        await queryRunner.query(`DROP TYPE "public"."emergency_scenario_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59a7946f56cddfd6f80fafda48"`);
        await queryRunner.query(`DROP TABLE "feedback"`);
        await queryRunner.query(`DROP TYPE "public"."feedback_category_enum"`);
        await queryRunner.query(`DROP TABLE "lmra_assessment"`);
        await queryRunner.query(`DROP TYPE "public"."lmra_assessment_decision_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ccf6b7c292e60dee21c3c8b4a2"`);
        await queryRunner.query(`DROP TABLE "risk"`);
        await queryRunner.query(`DROP TYPE "public"."risk_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."risk_level_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_787089ec459a4371eebe09625b"`);
        await queryRunner.query(`DROP TABLE "action_plan"`);
        await queryRunner.query(`DROP TYPE "public"."action_plan_status_enum"`);
    }

}
