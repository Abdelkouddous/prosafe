import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase2BInventoryMaintenanceTrainings1795279595670 implements MigrationInterface {
    name = 'Phase2BInventoryMaintenanceTrainings1795279595670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "training" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "description" text, "category" character varying(60), "durationHours" double precision, "validityMonths" integer, "mandatoryForRoles" text array NOT NULL DEFAULT '{}', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c436c96be3adf1aa439ef471427" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."training_session_status_enum" AS ENUM('planned', 'ongoing', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "training_session" ("id" SERIAL NOT NULL, "trainingId" integer NOT NULL, "startAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endAt" TIMESTAMP WITH TIME ZONE, "location" character varying(200), "trainer" character varying(200), "capacity" integer, "status" "public"."training_session_status_enum" NOT NULL DEFAULT 'planned', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a17a9657ff5a6e048bfd82c4651" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1d682e13f454789f22dfacdbda" ON "training_session" ("trainingId", "startAt") `);
        await queryRunner.query(`CREATE TYPE "public"."enrollment_status_enum" AS ENUM('registered', 'attended', 'passed', 'failed', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "enrollment" ("id" SERIAL NOT NULL, "sessionId" integer NOT NULL, "userId" integer NOT NULL, "status" "public"."enrollment_status_enum" NOT NULL DEFAULT 'registered', "score" integer, "progress" integer NOT NULL DEFAULT '0', "completedAt" TIMESTAMP WITH TIME ZONE, "expiresAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_enrollment_session_user" UNIQUE ("sessionId", "userId"), CONSTRAINT "PK_7e200c699fa93865cdcdd025885" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8528df561712d5e738cb1fd252" ON "enrollment" ("userId", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_type_enum" AS ENUM('inspection', 'preventive', 'corrective')`);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_result_enum" AS ENUM('ok', 'issues', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."maintenance_status_enum" AS ENUM('planned', 'done', 'overdue', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "maintenance" ("id" SERIAL NOT NULL, "itemId" integer NOT NULL, "type" "public"."maintenance_type_enum" NOT NULL DEFAULT 'inspection', "scheduledAt" TIMESTAMP WITH TIME ZONE NOT NULL, "doneAt" TIMESTAMP WITH TIME ZONE, "performedById" integer, "result" "public"."maintenance_result_enum", "notes" text, "status" "public"."maintenance_status_enum" NOT NULL DEFAULT 'planned', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_542fb6a28537140d2df95faa52a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_afeea1b8046ef61acf5568894a" ON "maintenance" ("status", "scheduledAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_637d427392ff0e6cab2611e8eb" ON "maintenance" ("itemId", "status") `);
        await queryRunner.query(`CREATE TYPE "public"."inventory_item_condition_enum" AS ENUM('functional', 'non_functional')`);
        await queryRunner.query(`ALTER TABLE "inventory_item" ADD "condition" "public"."inventory_item_condition_enum" NOT NULL DEFAULT 'functional'`);
        await queryRunner.query(`ALTER TABLE "inventory_item" ADD "expiryDate" date`);
        await queryRunner.query(`ALTER TABLE "inventory_item" ADD "lastInspectionAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "inventory_item" ADD "nextInspectionAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TYPE "public"."inventory_item_category_enum" RENAME TO "inventory_item_category_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_item_category_enum" AS ENUM('ppe', 'fire_extinguisher', 'first_aid', 'detection', 'signage', 'tools', 'consumables', 'other')`);
        await queryRunner.query(`ALTER TABLE "inventory_item" ALTER COLUMN "category" TYPE "public"."inventory_item_category_enum" USING (CASE "category"::"text" WHEN 'safety_equipment' THEN 'ppe' WHEN 'tools' THEN 'tools' WHEN 'consumables' THEN 'consumables' ELSE 'other' END)::"public"."inventory_item_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_item_category_enum_old"`);
        await queryRunner.query(`ALTER TABLE "training_session" ADD CONSTRAINT "FK_d8bac9ba91c7006a7067272ff3f" FOREIGN KEY ("trainingId") REFERENCES "training"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollment" ADD CONSTRAINT "FK_a5d2a945d9e9f739724445b0855" FOREIGN KEY ("sessionId") REFERENCES "training_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollment" ADD CONSTRAINT "FK_e97ecbf11356b5173ce7fb0b060" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance" ADD CONSTRAINT "FK_52ad5c331eeb6026c4e5eed108c" FOREIGN KEY ("itemId") REFERENCES "inventory_item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance" ADD CONSTRAINT "FK_452f6becc8a11e2ecb54bc0b6ed" FOREIGN KEY ("performedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // Data migration: every legacy `task` (training announcement) becomes a training + one session.
        // The legacy tasks module/table is kept untouched; clients move to /trainings later.
        const tasks: any[] = await queryRunner.query(`SELECT * FROM "task" ORDER BY "id"`);
        for (const t of tasks) {
            const [training] = await queryRunner.query(
                `INSERT INTO "training" ("title", "description", "category", "mandatoryForRoles", "isActive") VALUES ($1, $2, 'general', '{}', true) RETURNING "id"`,
                [t.title, t.description],
            );
            const startAt = t.startDate ?? t.dueDate ?? t.created_at;
            const endAt = t.dueDate && new Date(t.dueDate) > new Date(startAt) ? t.dueDate : null;
            const status = t.status === 'completed' ? 'completed' : t.status === 'in_progress' ? 'ongoing' : 'planned';
            await queryRunner.query(
                `INSERT INTO "training_session" ("trainingId", "startAt", "endAt", "location", "capacity", "status") VALUES ($1, $2, $3, $4, $5, $6)`,
                [training.id, startAt, endAt, t.location, t.maxParticipants, status],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "maintenance" DROP CONSTRAINT "FK_452f6becc8a11e2ecb54bc0b6ed"`);
        await queryRunner.query(`ALTER TABLE "maintenance" DROP CONSTRAINT "FK_52ad5c331eeb6026c4e5eed108c"`);
        await queryRunner.query(`ALTER TABLE "enrollment" DROP CONSTRAINT "FK_e97ecbf11356b5173ce7fb0b060"`);
        await queryRunner.query(`ALTER TABLE "enrollment" DROP CONSTRAINT "FK_a5d2a945d9e9f739724445b0855"`);
        await queryRunner.query(`ALTER TABLE "training_session" DROP CONSTRAINT "FK_d8bac9ba91c7006a7067272ff3f"`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_item_category_enum_old" AS ENUM('electronics', 'office_supplies', 'furniture', 'safety_equipment', 'tools', 'consumables', 'other')`);
        await queryRunner.query(`ALTER TABLE "inventory_item" ALTER COLUMN "category" TYPE "public"."inventory_item_category_enum_old" USING (CASE "category"::"text" WHEN 'ppe' THEN 'safety_equipment' WHEN 'fire_extinguisher' THEN 'safety_equipment' WHEN 'first_aid' THEN 'safety_equipment' WHEN 'detection' THEN 'safety_equipment' WHEN 'signage' THEN 'safety_equipment' ELSE "category"::"text" END)::"public"."inventory_item_category_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_item_category_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."inventory_item_category_enum_old" RENAME TO "inventory_item_category_enum"`);
        await queryRunner.query(`ALTER TABLE "inventory_item" DROP COLUMN "nextInspectionAt"`);
        await queryRunner.query(`ALTER TABLE "inventory_item" DROP COLUMN "lastInspectionAt"`);
        await queryRunner.query(`ALTER TABLE "inventory_item" DROP COLUMN "expiryDate"`);
        await queryRunner.query(`ALTER TABLE "inventory_item" DROP COLUMN "condition"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_item_condition_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_637d427392ff0e6cab2611e8eb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_afeea1b8046ef61acf5568894a"`);
        await queryRunner.query(`DROP TABLE "maintenance"`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_result_enum"`);
        await queryRunner.query(`DROP TYPE "public"."maintenance_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8528df561712d5e738cb1fd252"`);
        await queryRunner.query(`DROP TABLE "enrollment"`);
        await queryRunner.query(`DROP TYPE "public"."enrollment_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1d682e13f454789f22dfacdbda"`);
        await queryRunner.query(`DROP TABLE "training_session"`);
        await queryRunner.query(`DROP TYPE "public"."training_session_status_enum"`);
        await queryRunner.query(`DROP TABLE "training"`);
    }

}
