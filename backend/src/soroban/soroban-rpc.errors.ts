export class RpcUnavailableError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RpcUnavailableError';
  }
}

export class RpcNotFoundError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RpcNotFoundError';
  }
}

export class RpcRateLimitedError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RpcRateLimitedError';
  }
}
