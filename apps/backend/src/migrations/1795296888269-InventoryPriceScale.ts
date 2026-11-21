import { MigrationInterface, QueryRunner } from "typeorm";

export class InventoryPriceScale1795296888269 implements MigrationInterface {
    name = 'InventoryPriceScale1795296888269'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_item" ALTER COLUMN "price" TYPE numeric(12,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_item" ALTER COLUMN "price" TYPE numeric(10,5)`);
    }

}
