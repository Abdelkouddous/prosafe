import { FeedbackService } from './feedback.service';
import { FeedbackCategory } from './enums/feedback.enums';

describe('FeedbackService', () => {
  const qb = (extra: any) => {
    const q: any = {};
    for (const m of ['leftJoin', 'addSelect', 'select', 'orderBy', 'addOrderBy', 'skip', 'take', 'andWhere']) q[m] = jest.fn().mockReturnValue(q);
    return Object.assign(q, extra);
  };

  it('create stores the authenticated user', async () => {
    const repo: any = { create: jest.fn((x) => x), save: jest.fn(async (x) => ({ id: 1, ...x })) };
    const res = await new FeedbackService(repo).create({ rating: 4, category: FeedbackCategory.BUG, comment: 'x' }, 7);
    expect(res).toMatchObject({ userId: 7, rating: 4, appVersion: null });
  });

  it('findAll returns the page and the average rating rounded to 1 decimal', async () => {
    const list = qb({ getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 3]) });
    const avg = qb({ getRawOne: jest.fn().mockResolvedValue({ avg: '3.6666' }) });
    const repo: any = { createQueryBuilder: jest.fn().mockReturnValueOnce(list).mockReturnValueOnce(avg) };
    const res = await new FeedbackService(repo).findAll({ page: 1, limit: 20, category: FeedbackCategory.BUG });
    expect(res).toEqual({ data: [{ id: 1 }], total: 3, page: 1, limit: 20, averageRating: 3.7 });
    expect(avg.andWhere).toHaveBeenCalled(); // the average honours the same filters
  });

  it('averageRating is null without feedback', async () => {
    const repo: any = {
      createQueryBuilder: jest.fn().mockReturnValueOnce(qb({ getManyAndCount: jest.fn().mockResolvedValue([[], 0]) })).mockReturnValueOnce(qb({ getRawOne: jest.fn().mockResolvedValue({ avg: null }) })),
    };
    expect((await new FeedbackService(repo).findAll({})).averageRating).toBeNull();
  });
});
