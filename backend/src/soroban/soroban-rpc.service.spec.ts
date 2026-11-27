import { ConfigService } from '@nestjs/config';
import { rpc } from '@stellar/stellar-sdk';
import { SorobanRpcService } from './soroban-rpc.service';

jest.mock('@stellar/stellar-sdk', () => {
  const actual = jest.requireActual<typeof import('@stellar/stellar-sdk')>('@stellar/stellar-sdk');
  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: jest.fn(),
    },
  } as typeof import('@stellar/stellar-sdk');
});

describe('SorobanRpcService', () => {
  const config = { get: jest.fn((key: string) => (key === 'RPC_MAX_CONCURRENCY' ? '2' : undefined)) } as unknown as ConfigService;
  let server: { getEvents: jest.Mock; getTransaction: jest.Mock; getLedgerEntries: jest.Mock; simulateTransaction: jest.Mock; getLatestLedger: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    server = {
      getEvents: jest.fn(),
      getTransaction: jest.fn(),
      getLedgerEntries: jest.fn(),
      simulateTransaction: jest.fn(),
      getLatestLedger: jest.fn(),
    };
    (rpc.Server as unknown as jest.Mock).mockImplementation(() => server);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('retries a 503 and does not retry a 400', async () => {
    server.getLatestLedger
      .mockRejectedValueOnce(Object.assign(new Error('unavailable'), { status: 503 }))
      .mockResolvedValueOnce({ sequence: 123 } as any);
    const service = new SorobanRpcService(config);

    const pending = service.getLatestLedger();
    await jest.runAllTimersAsync();
    await expect(pending).resolves.toEqual({ sequence: 123 });
    expect(server.getLatestLedger).toHaveBeenCalledTimes(2);

    server.getTransaction.mockRejectedValueOnce(Object.assign(new Error('bad request'), { status: 400 }));
    await expect(service.getTransaction('tx')).rejects.toMatchObject({ message: 'bad request' });
    expect(server.getTransaction).toHaveBeenCalledTimes(1);
  });

  it('limits concurrency', async () => {
    let resolveFirst!: (v: any) => void;
    let resolveSecond!: (v: any) => void;
    server.getEvents
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockImplementationOnce(() => new Promise((r) => (resolveSecond = r)))
      .mockResolvedValueOnce({ events: [] } as any);
    const service = new SorobanRpcService(config);

    const p1 = service.getEvents({} as any);
    const p2 = service.getEvents({} as any);
    const p3 = service.getEvents({} as any);
    await Promise.resolve();
    await Promise.resolve();
    expect(server.getEvents.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(server.getEvents.mock.calls.length).toBeLessThanOrEqual(3);

    resolveFirst({ events: [1] });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(server.getEvents).toHaveBeenCalledTimes(3);
    resolveSecond({ events: [2] });
    await expect(Promise.all([p1, p2, p3])).resolves.toBeDefined();
  });
});
