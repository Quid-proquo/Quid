import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  const prisma: any = {
    webhookSubscription: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  let service: WebhooksService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new WebhooksService(prisma);
  });

  it('rejects private IP URLs', async () => {
    await expect(service.assertSafeUrl('https://127.0.0.1/hook')).rejects.toThrow();
    await expect(service.assertSafeUrl('https://10.0.0.1/hook')).rejects.toThrow();
  });

  it('shows secret once and stores hash', async () => {
    prisma.webhookSubscription.count.mockResolvedValue(0);
    (service as any).assertSafeUrl = jest.fn().mockResolvedValue(undefined);
    prisma.webhookSubscription.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: '1', ...data }),
    );
    const res = await service.create('GOWNER', { url: 'https://example.com/hook', events: ['report.new'] });
    expect(res.secret).toBeDefined();
    expect(res.secretHash).not.toBe(res.secret);
  });
});
