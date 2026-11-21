import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join, resolve } from 'path';
import { diskStorage } from 'multer';

export type FileKind = 'image' | 'video' | 'document';

const MB = 1024 * 1024;

/** Allowed mime types and max size per kind (docs/API_CONTRACT.md > Files). */
export const FILE_RULES: Record<FileKind, { mimes: string[]; maxSize: number }> = {
  image: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxSize: 10 * MB },
  video: { mimes: ['video/mp4', 'video/quicktime'], maxSize: 50 * MB },
  document: {
    mimes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    maxSize: 20 * MB,
  },
};

export const getUploadsDir = (): string => resolve(process.env.UPLOADS_DIR ?? 'uploads');

export const ensureUploadsDir = (): string => {
  const dir = getUploadsDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
};

/** Returns the kind matching a mime type, or null when not allowed. */
export const kindOfMime = (mime: string): FileKind | null => {
  const m = (mime ?? '').toLowerCase();
  for (const kind of Object.keys(FILE_RULES) as FileKind[]) {
    if (FILE_RULES[kind].mimes.includes(m)) return kind;
  }
  return null;
};

/** Largest size limit of the allowed kinds (multer-level hard cap; per-kind size is checked after upload). */
const maxOf = (kinds: FileKind[]) => Math.max(...kinds.map((k) => FILE_RULES[k].maxSize));

/**
 * Reusable multer options: disk storage under UPLOADS_DIR with random file names,
 * mime filter for the given kinds and a hard size cap. Per-kind size limits are enforced
 * by FilesService.saveUploaded (e.g. an image may not exceed 10 MB even if videos can reach 50 MB).
 */
export const buildMulterOptions = (kinds: FileKind[] = ['image', 'video'], maxFiles = 5) => ({
  storage: diskStorage({
    destination: (_req, _file, cb) => cb(null, ensureUploadsDir()),
    filename: (_req, file, cb) => cb(null, `${randomBytes(16).toString('hex')}${extname(file.originalname).toLowerCase().slice(0, 10)}`),
  }),
  fileFilter: (_req: any, file: Express.Multer.File, cb: (err: Error | null, accept: boolean) => void) => {
    const kind = kindOfMime(file.mimetype);
    if (!kind || !kinds.includes(kind)) {
      return cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
    }
    cb(null, true);
  },
  limits: { fileSize: maxOf(kinds), files: maxFiles },
});

export const resolveStoredPath = (relativePath: string): string => join(getUploadsDir(), relativePath);
