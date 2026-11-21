import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomBytes } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Phase 2A data migration:
 *  - moves every `incident.photo` bytea to a file under UPLOADS_DIR, creating `stored_file` + `incident_media` rows,
 *  - drops the `photo` column (`photoHash` is kept for duplicate detection),
 *  - back-fills `incident_history` for pre-existing incidents (null -> open, then open -> current status).
 * Files are written during the migration, so run it on the host/volume that serves UPLOADS_DIR.
 */
export class MovePhotosToDisk1795278939665 implements MigrationInterface {
  name = 'MovePhotosToDisk1795278939665';

  private sniff(buf: Buffer): { mime: string; ext: string } {
    if (buf.length > 3 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e) return { mime: 'image/png', ext: '.png' };
    if (buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return { mime: 'image/webp', ext: '.webp' };
    return { mime: 'image/jpeg', ext: '.jpg' };
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dir = resolve(process.env.UPLOADS_DIR ?? 'uploads');
    mkdirSync(dir, { recursive: true });

    // One row at a time to keep memory bounded
    const ids: { id: number; reportedBy: number; incidentId: string }[] = await queryRunner.query(
      `SELECT "id", "reportedBy", "incidentId" FROM "incident" WHERE "photo" IS NOT NULL ORDER BY "id"`,
    );
    for (const row of ids) {
      const [{ photo }] = await queryRunner.query(`SELECT "photo" FROM "incident" WHERE "id" = $1`, [row.id]);
      const buf: Buffer = Buffer.isBuffer(photo) ? photo : Buffer.from(photo);
      if (!buf.length) continue;
      const { mime, ext } = this.sniff(buf);
      const filename = `${randomBytes(16).toString('hex')}${ext}`;
      writeFileSync(join(dir, filename), buf);
      const [file] = await queryRunner.query(
        `INSERT INTO "stored_file" ("path", "originalName", "mimeType", "size", "uploadedById") VALUES ($1, $2, $3, $4, $5) RETURNING "id"`,
        [filename, `${row.incidentId}${ext}`, mime, buf.length, row.reportedBy],
      );
      await queryRunner.query(`INSERT INTO "incident_media" ("incidentRefId", "fileId", "kind") VALUES ($1, $2, 'image')`, [row.id, file.id]);
    }
    await queryRunner.query(`ALTER TABLE "incident" DROP COLUMN "photo"`);

    // History back-fill (only for incidents without any history row)
    await queryRunner.query(
      `INSERT INTO "incident_history" ("incidentRefId", "fromStatus", "toStatus", "comment", "changedById", "changedAt")
       SELECT i."id", NULL, 'open', NULL, i."reportedBy", i."createdAt" FROM "incident" i
       WHERE NOT EXISTS (SELECT 1 FROM "incident_history" h WHERE h."incidentRefId" = i."id")`,
    );
    await queryRunner.query(
      `INSERT INTO "incident_history" ("incidentRefId", "fromStatus", "toStatus", "comment", "changedById", "changedAt")
       SELECT i."id", 'open', i."status"::text::"public"."incident_history_tostatus_enum", NULL, i."resolvedBy", COALESCE(i."resolvedAt", i."updatedAt") FROM "incident" i
       WHERE i."status" <> 'open'
         AND (SELECT count(*) FROM "incident_history" h WHERE h."incidentRefId" = i."id") = 1`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Image bytes are not copied back into the database (files stay on disk); the column is only restored.
    await queryRunner.query(`ALTER TABLE "incident" ADD "photo" bytea`);
  }
}
