import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { Observable, catchError, from, switchMap, throwError } from 'rxjs';

/**
 * Place AFTER the multer interceptor: if the request fails (validation, business error...)
 * the files multer already wrote to disk are removed so nothing is orphaned.
 */
@Injectable()
export class CleanupUploadsOnErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      catchError((err) => {
        const files: Express.Multer.File[] = [];
        if (Array.isArray(req.files)) files.push(...req.files);
        else if (req.files && typeof req.files === 'object') Object.values<Express.Multer.File[]>(req.files).forEach((f) => files.push(...f));
        if (req.file) files.push(req.file);
        return from(Promise.all(files.map((f) => (f.path ? unlink(f.path).catch(() => undefined) : undefined)))).pipe(
          switchMap(() => throwError(() => err)),
        );
      }),
    );
  }
}
