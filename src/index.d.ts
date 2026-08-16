export type SolveInput = {
  data: Record<string, unknown>;
  solveOptions?: Record<string, unknown>;
};

export type RequestOptions = {
  routingKey?: string;
  signal?: AbortSignal;
};

export type WaitOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
};

export class OptiForgeError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  constructor(
    message: string,
    options?: { status?: number; code?: string; details?: unknown },
  );
}

export class OptiForgeClient {
  constructor(options: {
    baseUrl: string;
    apiKey: string;
    fetch?: typeof globalThis.fetch;
  });

  solve(
    modelKey: string,
    input: SolveInput,
    options?: RequestOptions,
  ): Promise<unknown>;

  enqueue(
    modelKey: string,
    input: SolveInput,
    options?: RequestOptions,
  ): Promise<unknown>;

  getJob(jobId: string, options?: Pick<RequestOptions, "signal">): Promise<unknown>;
  getExecution(
    executionId: string,
    options?: Pick<RequestOptions, "signal">,
  ): Promise<unknown>;
  waitForJob(jobId: string, options?: WaitOptions): Promise<unknown>;
}
