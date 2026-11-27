import { ConfigService } from '@nestjs/config';
import { AnchorDiscoveryService } from './anchor-discovery.service';

describe('AnchorDiscoveryService', () => {
  const prisma: any = { anchor: { upsert: jest.fn(), findMany: jest.fn() } };
  const config = { get: jest.fn((k: string) => (k === 'ANCHOR_DOMAINS' ? 'testanchor.stellar.org' : undefined)) } as unknown as ConfigService;
  let service: AnchorDiscoveryService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new AnchorDiscoveryService(prisma, config);
  });

  it('marks anchor healthy on happy path', async () => {
    (service as any).fetchToml = jest.fn().mockResolvedValue({
      TRANSFER_SERVER_SEP0024: 'https://testanchor.stellar.org/sep24',
      CURRENCIES: [{ code: 'USDC', country_codes: ['NG'] }],
      ORG_NAME: 'Test Anchor',
    });
    (service as any).fetchSep24Info = jest.fn().mockResolvedValue({ withdraw: { USDC: { enabled: true } } });
    prisma.anchor.upsert.mockResolvedValue({});

    await service.refreshDomain('testanchor.stellar.org');
    expect(prisma.anchor.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ healthy: true }),
    }));
  });

  it('marks anchor unhealthy on invalid toml', async () => {
    (service as any).fetchToml = jest.fn().mockResolvedValue({});
    prisma.anchor.upsert.mockResolvedValue({});
    await service.refreshDomain('bad.anchor');
    expect(prisma.anchor.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ healthy: false }),
    }));
  });

  it('filters by country and asset', async () => {
    prisma.anchor.findMany.mockResolvedValue([
      { domain: 'a', healthy: true, countries: ['NG'], assets: [{ code: 'NGN' }] },
      { domain: 'b', healthy: true, countries: ['US'], assets: [{ code: 'USD' }] },
    ]);
    await expect(service.list({ country: 'NG', asset: 'NGN' })).resolves.toHaveLength(1);
  });
});
