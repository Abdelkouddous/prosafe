import { MigrationInterface, QueryRunner } from "typeorm";

export class IncidentRejected1795296455911 implements MigrationInterface {
    name = 'IncidentRejected1795296455911'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "incident" ADD "rejected" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "rejected"`);
    }

}
