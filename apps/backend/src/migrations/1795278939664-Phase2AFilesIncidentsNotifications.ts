import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase2AFilesIncidentsNotifications1795278939664 implements MigrationInterface {
    name = 'Phase2AFilesIncidentsNotifications1795278939664'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stored_file" ("id" SERIAL NOT NULL, "path" character varying NOT NULL, "originalName" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" integer NOT NULL, "uploadedById" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e140967af84027b493a3ff04fbb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."incident_media_kind_enum" AS ENUM('image', 'video')`);
        await queryRunner.query(`CREATE TABLE "incident_media" ("id" SERIAL NOT NULL, "incidentRefId" integer NOT NULL, "fileId" integer NOT NULL, "kind" "public"."incident_media_kind_enum" NOT NULL, CONSTRAINT "PK_fd98bc39576f404d5dd60adc3e9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1e3d6f123866b7ca4a0aaa9be2" ON "incident_media" ("incidentRefId") `);
        await queryRunner.query(`CREATE TYPE "public"."incident_history_fromstatus_enum" AS ENUM('open', 'resolved', 'investigating', 'closed')`);
        await queryRunner.query(`CREATE TYPE "public"."incident_history_tostatus_enum" AS ENUM('open', 'resolved', 'investigating', 'closed')`);
        await queryRunner.query(`CREATE TABLE "incident_history" ("id" SERIAL NOT NULL, "incidentRefId" integer NOT NULL, "fromStatus" "public"."incident_history_fromstatus_enum", "toStatus" "public"."incident_history_tostatus_enum" NOT NULL, "comment" text, "changedById" integer, "changedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3c5e99493cd3a7310e0053951e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_73dc70fae6f56edd2ff582a8e7" ON "incident_history" ("incidentRefId") `);
        await queryRunner.query(`CREATE TABLE "notification_preference" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "incidents" boolean NOT NULL DEFAULT true, "trainings" boolean NOT NULL DEFAULT true, "audits" boolean NOT NULL DEFAULT true, "inventory" boolean NOT NULL DEFAULT true, "emergency" boolean NOT NULL DEFAULT true, "messages" boolean NOT NULL DEFAULT true, "push" boolean NOT NULL DEFAULT true, "email" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_c8721bd56ae600308745ad49744" UNIQUE ("userId"), CONSTRAINT "REL_c8721bd56ae600308745ad4974" UNIQUE ("userId"), CONSTRAINT "PK_ba8d816b10f3dcfcd2e71ce5776" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "type" character varying(30) NOT NULL, "title" character varying(200) NOT NULL, "body" text NOT NULL, "data" jsonb, "readAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_705b6c7cdf9b2c2ff7ac7872cb7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b142beadffd32dfe9c1afc1c28" ON "notification" ("userId", "readAt") `);
        await queryRunner.query(`CREATE TABLE "device_token" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "token" character varying NOT NULL, "platform" character varying(20) NOT NULL, "lastSeenAt" TIMESTAMP NOT NULL DEFAULT now(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d959c11311d3002e4bb10d9edbd" UNIQUE ("token"), CONSTRAINT "PK_592ce89b9ea1a268d6140f60422" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ba0cbbc3097f061e197e71c112" ON "device_token" ("userId") `);
        await queryRunner.query(`ALTER TABLE "incident" ADD "notes" text`);
        await queryRunner.query(`ALTER TABLE "incident" ADD "zone" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "incident" ADD "department" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "phone" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "department" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "zone" character varying(100)`);
        await queryRunner.query(`ALTER TYPE "public"."incident_type_enum" RENAME TO "incident_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."incident_type_enum" AS ENUM('safety', 'security', 'hr_violation', 'environment', 'near_miss', 'equipment_failure', 'other')`);
        await queryRunner.query(`ALTER TABLE "incident" ALTER COLUMN "type" TYPE "public"."incident_type_enum" USING "type"::"text"::"public"."incident_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."incident_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "stored_file" ADD CONSTRAINT "FK_65d1684f4813771db451446f0bd" FOREIGN KEY ("uploadedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_media" ADD CONSTRAINT "FK_1e3d6f123866b7ca4a0aaa9be21" FOREIGN KEY ("incidentRefId") REFERENCES "incident"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_media" ADD CONSTRAINT "FK_557d30217b28df24a80511b0dd3" FOREIGN KEY ("fileId") REFERENCES "stored_file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_history" ADD CONSTRAINT "FK_73dc70fae6f56edd2ff582a8e70" FOREIGN KEY ("incidentRefId") REFERENCES "incident"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "incident_history" ADD CONSTRAINT "FK_a2f1b8246d433f3c6928b15d244" FOREIGN KEY ("changedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preference" ADD CONSTRAINT "FK_c8721bd56ae600308745ad49744" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_1ced25315eb974b73391fb1c81b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "device_token" ADD CONSTRAINT "FK_ba0cbbc3097f061e197e71c112e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_token" DROP CONSTRAINT "FK_ba0cbbc3097f061e197e71c112e"`);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_1ced25315eb974b73391fb1c81b"`);
        await queryRunner.query(`ALTER TABLE "notification_preference" DROP CONSTRAINT "FK_c8721bd56ae600308745ad49744"`);
        await queryRunner.query(`ALTER TABLE "incident_history" DROP CONSTRAINT "FK_a2f1b8246d433f3c6928b15d244"`);
        await queryRunner.query(`ALTER TABLE "incident_history" DROP CONSTRAINT "FK_73dc70fae6f56edd2ff582a8e70"`);
        await queryRunner.query(`ALTER TABLE "incident_media" DROP CONSTRAINT "FK_557d30217b28df24a80511b0dd3"`);
        await queryRunner.query(`ALTER TABLE "incident_media" DROP CONSTRAINT "FK_1e3d6f123866b7ca4a0aaa9be21"`);
        await queryRunner.query(`ALTER TABLE "stored_file" DROP CONSTRAINT "FK_65d1684f4813771db451446f0bd"`);
        await queryRunner.query(`CREATE TYPE "public"."incident_type_enum_old" AS ENUM('safety', 'security', 'hr_violation')`);
        await queryRunner.query(`ALTER TABLE "incident" ALTER COLUMN "type" TYPE "public"."incident_type_enum_old" USING "type"::"text"::"public"."incident_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."incident_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."incident_type_enum_old" RENAME TO "incident_type_enum"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "zone"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "department"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "department"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "zone"`);
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "notes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba0cbbc3097f061e197e71c112"`);
        await queryRunner.query(`DROP TABLE "device_token"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b142beadffd32dfe9c1afc1c28"`);
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "notification_preference"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_73dc70fae6f56edd2ff582a8e7"`);
        await queryRunner.query(`DROP TABLE "incident_history"`);
        await queryRunner.query(`DROP TYPE "public"."incident_history_tostatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."incident_history_fromstatus_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e3d6f123866b7ca4a0aaa9be2"`);
        await queryRunner.query(`DROP TABLE "incident_media"`);
        await queryRunner.query(`DROP TYPE "public"."incident_media_kind_enum"`);
        await queryRunner.query(`DROP TABLE "stored_file"`);
    }

}
