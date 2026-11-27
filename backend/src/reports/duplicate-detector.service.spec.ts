import { DuplicateDetectorService } from './duplicate-detector.service';

describe('DuplicateDetectorService', () => {
  const prisma: any = { submission: { findUnique: jest.fn(), findMany: jest.fn() }, duplicateCandidate: { create: jest.fn() } };
  const service = new DuplicateDetectorService(prisma);

  it('flags identical/paraphrased and not unrelated', () => {
    const a = 'The login button does not work on mobile safari';
    const b = 'The login button does not work on mobile safari';
    const c = 'Completely different issue about image upload';
    expect(service.textSimilarity(a, b)).toBeGreaterThanOrEqual(0.8);
    expect(service.textSimilarity(a, c)).toBeLessThan(0.8);
  });
});
