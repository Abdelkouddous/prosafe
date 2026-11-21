import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 1: legacy roles 'standard' and 'premium' are replaced by 'employee'.
 * `roles` is a simple-array column (comma separated text).
 */
export class MapLegacyRoles1795278357169 implements MigrationInterface {
  name = 'MapLegacyRoles1795278357169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "user" SET "roles" = replace(replace("roles", 'premium', 'employee'), 'standard', 'employee')`);
    // A user that had both legacy roles would now read "employee,employee"
    await queryRunner.query(`UPDATE "user" SET "roles" = 'employee' WHERE "roles" = 'employee,employee'`);
  }

  public async down(): Promise<void> {
    // Not reversible: the original standard/premium distinction is lost.
  }
}
