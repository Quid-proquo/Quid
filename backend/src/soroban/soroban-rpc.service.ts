import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { rpc } from '@stellar/stellar-sdk';
import { RpcNotFoundError, RpcRateLimitedError, RpcUnavailableError } from './soroban-rpc.errors';

type RpcServer = rpc.Server;

const DEFAULT_MAX_CONCURRENCY = 8;
const MAX_RETRIES = 4;

@Injectable()
export class SorobanRpcService {
  private readonly server: RpcServer;
  private readonly maxConcurrency: number;
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly config: ConfigService) {
    const rpcUrl = this.config.get<string>('RPC_URL') ?? 'http://localhost:8000';
    this.server = new rpc.Server(rpcUrl, { allowHttp: rpcUrl.startsWith('http://') });
    const configured = Number(this.config.get<string>('RPC_MAX_CONCURRENCY') ?? DEFAULT_MAX_CONCURRENCY);
    this.maxConcurrency = Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_MAX_CONCURRENCY;
  }

  async getEvents(request: Parameters<RpcServer['getEvents']>[0]): ReturnType<RpcServer['getEvents']> {
    return this.withRetryAndLimit(() => this.server.getEvents(request));
  }

  async getTransaction(hash: string): ReturnType<RpcServer['getTransaction']> {
    return this.withRetryAndLimit(() => this.server.getTransaction(hash));
  }

  async getLedgerEntries(...keys: Parameters<RpcServer['getLedgerEntries']>): ReturnType<RpcServer['getLedgerEntries']> {
    return this.withRetryAndLimit(() => this.server.getLedgerEntries(...keys));
  }

  async simulateTransaction(...args: Parameters<RpcServer['simulateTransaction']>): ReturnType<RpcServer['simulateTransaction']> {
    return this.withRetryAndLimit(() => this.server.simulateTransaction(...args));
  }

  async getLatestLedger(): ReturnType<RpcServer['getLatestLedger']> {
    return this.withRetryAndLimit(() => this.server.getLatestLedger());
  }

  private async withRetryAndLimit<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await this.withRetry(fn);
    } finally {
      this.release();
    }
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    let lastError: unknown;
    while (attempt < MAX_RETRIES) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const mapped = this.mapError(error);
        if (mapped instanceof RpcNotFoundError || this.isNonRetryable4xx(error)) {
          throw mapped;
        }
        attempt += 1;
        if (attempt >= MAX_RETRIES) throw mapped;
        const backoff = Math.min(1000 * 2 ** (attempt - 1), 8000);
        const jitter = Math.floor(Math.random() * 250);
        await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
      }
    }
    throw this.mapError(lastError);
  }

  private isNonRetryable4xx(error: unknown): boolean {
    const status = this.getStatus(error);
    return status !== undefined && status >= 400 && status < 500 && status !== 429;
  }

  private getStatus(error: unknown): number | undefined {
    if (!error || typeof error !== 'object') return undefined;
    const anyErr = error as { status?: number; response?: { status?: number }; code?: number };
    return anyErr.status ?? anyErr.response?.status ?? (typeof anyErr.code === 'number' ? anyErr.code : undefined);
  }

  private mapError(error: unknown): Error {
    const status = this.getStatus(error);
    const message = error instanceof Error ? error.message : String(error);
    if (status === 404) return new RpcNotFoundError(message, error);
    if (status === 429) return new RpcRateLimitedError(message, error);
    if (status !== undefined && status >= 400 && status < 500) return error instanceof Error ? error : new Error(message);
    if (status !== undefined && status >= 500) return new RpcUnavailableError(message, error);
    return new RpcUnavailableError(message, error);
  }

  private acquire(): Promise<void> {
    if (this.active < this.maxConcurrency) {
      this.active += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve();
      });
    });
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    const next = this.queue.shift();
    if (next) next();
  }
}
