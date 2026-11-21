import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { MANAGER_ROLES } from '../users/enums/role.enum';
import { CreateComplianceDocumentDto, ListComplianceDocumentsQueryDto } from './dto/audit.dto';
import { ComplianceDocument } from './entities/compliance-document.entity';
import { Audit } from './entities/audit.entity';

const DAY = 24 * 60 * 60 * 1000;
export const EXPIRY_WARNING_DAYS = 30;

@Injectable()
export class ComplianceDocumentsService {
  private readonly logger = new Logger(ComplianceDocumentsService.name);

  constructor(
    @InjectRepository(ComplianceDocument) private readonly repo: Repository<ComplianceDocument>,
    @InjectRepository(Audit) private readonly auditRepo: Repository<Audit>,
    private readonly files: FilesService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateComplianceDocumentDto, file: Express.Multer.File | undefined, user: { id: number }) {
    if (!file) throw new BadRequestException('A file is required (multipart field "file")');
    if (dto.auditId !== undefined && !(await this.auditRepo.count({ where: { id: dto.auditId } }))) {
      await this.files.removeFromDisk(file.filename);
      throw new NotFoundException('Audit not found');
    }
    const stored = await this.files.saveUploaded(file, user);
    try {
      const saved = await this.repo.save(
        this.repo.create({
          title: dto.title,
          type: dto.type,
          fileId: stored.id,
          validUntil: dto.validUntil ?? null,
          auditId: dto.auditId ?? null,
          uploadedById: user.id,
        }),
      );
      return this.findOne(saved.id);
    } catch (err) {
      await this.files.discard([file], [stored]);
      throw err;
    }
  }

  async findAll(q: ListComplianceDocumentsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.file', 'file')
      .orderBy('d.createdAt', 'DESC')
      .addOrderBy('d.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (q.type) qb.andWhere('d.type = :type', { type: q.type });
    if (q.auditId !== undefined) qb.andWhere('d.auditId = :auditId', { auditId: q.auditId });
    if (q.expiring) qb.andWhere(`d.validUntil IS NOT NULL AND d.validUntil <= (CURRENT_DATE + ${EXPIRY_WARNING_DAYS})`);
    if (q.search) qb.andWhere('d.title ILIKE :s', { s: `%${q.search.replace(/[%_]/g, '\\$&')}%` });
    const [data, total] = await qb.getManyAndCount();
    return { data: data.map((d) => this.present(d)), total, page, limit };
  }

  async findOne(id: number) {
    const d = await this.repo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Compliance document not found');
    return this.present(d);
  }

  async remove(id: number): Promise<void> {
    const d = await this.repo.findOne({ where: { id } });
    if (!d) throw new NotFoundException('Compliance document not found');
    await this.repo.delete(id);
    await this.files.discard([{ filename: d.file.path } as Express.Multer.File], [d.file]);
  }

  private present(d: ComplianceDocument) {
    return {
      id: d.id,
      title: d.title,
      type: d.type,
      fileId: d.fileId,
      file: { id: d.file.id, originalName: d.file.originalName, mimeType: d.file.mimeType, size: d.file.size },
      validUntil: d.validUntil,
      auditId: d.auditId,
      uploadedById: d.uploadedById,
      createdAt: d.createdAt,
    };
  }

  // ---------- Scheduled job (daily 07:20 Africa/Algiers) ----------

  @Cron('20 7 * * *', { name: 'compliance-documents-expiry', timeZone: 'Africa/Algiers' })
  async runDailyChecks(now = new Date()): Promise<{ expiring: number }> {
    try {
      return { expiring: await this.notifyExpiring(now) };
    } catch (err) {
      this.logger.error(`document expiry check failed: ${(err as Error).message}`);
      return { expiring: 0 };
    }
  }

  /** Documents whose validUntil is within 30 days (or past) -> managers, at most once a week per document. */
  async notifyExpiring(now: Date): Promise<number> {
    const limit = new Date(now.getTime() + EXPIRY_WARNING_DAYS * DAY).toISOString().slice(0, 10);
    const docs = await this.repo
      .createQueryBuilder('d')
      .where('d.validUntil IS NOT NULL AND d.validUntil <= :limit', { limit })
      .getMany();
    for (const d of docs) {
      const expired = d.validUntil! < now.toISOString().slice(0, 10);
      await this.notifications.notifyRolesOnce(
        MANAGER_ROLES,
        {
          type: NotificationType.AUDIT,
          title: expired ? 'Document de conformité expiré' : 'Document de conformité bientôt expiré',
          body: `${d.title} (validité ${d.validUntil})`,
          data: { key: `compliance-doc-expiry:${d.id}`, complianceDocumentId: d.id },
        },
        24 * 7,
      );
    }
    return docs.length;
  }
}
