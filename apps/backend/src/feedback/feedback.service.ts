import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFeedbackDto, ListFeedbackQueryDto } from './dto/feedback.dto';
import { Feedback } from './entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(@InjectRepository(Feedback) private readonly repo: Repository<Feedback>) {}

  async create(dto: CreateFeedbackDto, userId: number): Promise<Feedback> {
    const saved = await this.repo.save(
      this.repo.create({
        userId,
        rating: dto.rating,
        category: dto.category,
        comment: dto.comment ?? null,
        appVersion: dto.appVersion ?? null,
        platform: dto.platform ?? null,
      }),
    );
    return saved;
  }

  /** Paginated list + `averageRating` (1 decimal, null when empty) over ALL feedback matching the filters. */
  async findAll(q: ListFeedbackQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.repo
      .createQueryBuilder('f')
      .leftJoin('f.user', 'u')
      .addSelect(['u.id', 'u.firstName', 'u.lastName'])
      .orderBy('f.createdAt', 'DESC')
      .addOrderBy('f.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const avgQb = this.repo.createQueryBuilder('f').select('AVG(f.rating)', 'avg');
    if (q.category) {
      qb.andWhere('f.category = :c', { c: q.category });
      avgQb.andWhere('f.category = :c', { c: q.category });
    }
    if (q.rating) {
      qb.andWhere('f.rating = :r', { r: q.rating });
      avgQb.andWhere('f.rating = :r', { r: q.rating });
    }
    const [[data, total], avgRow] = await Promise.all([qb.getManyAndCount(), avgQb.getRawOne()]);
    const averageRating = avgRow?.avg == null ? null : Math.round(Number(avgRow.avg) * 10) / 10;
    return { data, total, page, limit, averageRating };
  }
}
