import { BadRequestException, Injectable, NotFoundException, OnModuleInit, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createReadStream, existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { basename } from 'path';
import { Repository } from 'typeorm';
import { StoredFile } from './entities/stored-file.entity';
import { FILE_RULES, ensureUploadsDir, kindOfMime, resolveStoredPath, FileKind } from './upload.config';

@Injectable()
export class FilesService implements OnModuleInit {
  constructor(@InjectRepository(StoredFile) private readonly repo: Repository<StoredFile>) {}

  onModuleInit() {
    ensureUploadsDir();
  }

  /**
   * Persist metadata of a file already written to disk by multer (disk storage).
   * Enforces the per-kind size limit; on violation the file is removed from disk.
   */
  async saveUploaded(file: Express.Multer.File, user?: { id: number } | null): Promise<StoredFile> {
    const kind = kindOfMime(file.mimetype);
    if (!kind) {
      await this.removeFromDisk(file.filename);
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    if (file.size > FILE_RULES[kind].maxSize) {
      await this.removeFromDisk(file.filename);
      throw new BadRequestException(`${kind} files must be at most ${FILE_RULES[kind].maxSize / (1024 * 1024)} MB`);
    }
    return this.repo.save(
      this.repo.create({
        path: basename(file.filename),
        originalName: (file.originalname ?? file.filename).slice(0, 255),
        mimeType: file.mimetype,
        size: file.size,
        uploadedById: user?.id ?? null,
      }),
    );
  }

  kindOf(file: Pick<StoredFile, 'mimeType'>): FileKind | null {
    return kindOfMime(file.mimeType);
  }

  async findOne(id: number): Promise<StoredFile> {
    const file = await this.repo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async getStream(id: number): Promise<{ file: StoredFile; stream: StreamableFile }> {
    const file = await this.findOne(id);
    const full = resolveStoredPath(file.path);
    if (!existsSync(full)) throw new NotFoundException('File content not found');
    return {
      file,
      stream: new StreamableFile(createReadStream(full), {
        type: file.mimeType,
        length: file.size,
        disposition: `inline; filename="${encodeURIComponent(file.originalName)}"`,
      }),
    };
  }

  /** Rollback helper: removes uploaded files from disk and their metadata rows. Never throws. */
  async discard(uploaded: Express.Multer.File[], stored: StoredFile[]): Promise<void> {
    await Promise.all(uploaded.map((f) => this.removeFromDisk(f.filename)));
    if (stored.length) {
      await this.repo.delete(stored.map((s) => s.id)).catch(() => undefined);
    }
  }

  /** Best-effort cleanup of files left on disk when a request fails after upload. */
  async removeFromDisk(filename?: string): Promise<void> {
    if (!filename) return;
    try {
      await unlink(resolveStoredPath(basename(filename)));
    } catch {
      /* already gone */
    }
  }
}
