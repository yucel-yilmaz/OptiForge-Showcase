/** Error returned by an OptiForge HTTP endpoint. */
export class OptiForgeError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = "OptiForgeError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Small, dependency-free client for published OptiForge decision APIs.
 */
export class OptiForgeClient {
  constructor({ baseUrl, apiKey, fetch: fetchImplementation = globalThis.fetch }) {
    if (!baseUrl) throw new TypeError("baseUrl is required");
    if (!apiKey) throw new TypeError("apiKey is required");
    if (typeof fetchImplementation !== "function") {
      throw new TypeError("A Fetch API implementation is required");
    }

    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
    this.fetch = fetchImplementation;
  }

  async solve(modelKey, input, options = {}) {
    assertModelKey(modelKey);
    assertSolveInput(input);

    return this.#request(`/api/v1/models/${encodeURIComponent(modelKey)}/solve`, {
      method: "POST",
      body: input,
      routingKey: options.routingKey,
      signal: options.signal,
    });
  }

  async enqueue(modelKey, input, options = {}) {
    assertModelKey(modelKey);
    assertSolveInput(input);

    return this.#request(
      `/api/v1/models/${encodeURIComponent(modelKey)}/solve-jobs`,
      {
        method: "POST",
        body: input,
        routingKey: options.routingKey,
        signal: options.signal,
      },
    );
  }

  async getJob(jobId, options = {}) {
    assertIdentifier(jobId, "jobId");
    return this.#request(`/api/v1/solve-jobs/${encodeURIComponent(jobId)}`, {
      signal: options.signal,
    });
  }

  async getExecution(executionId, options = {}) {
    assertIdentifier(executionId, "executionId");
    return this.#request(
      `/api/v1/solve-executions/${encodeURIComponent(executionId)}`,
      { signal: options.signal },
    );
  }

  async waitForJob(
    jobId,
    { intervalMs = 1_000, timeoutMs = 60_000, signal } = {},
  ) {
    const startedAt = Date.now();

    while (true) {
      if (signal?.aborted) throw signal.reason;
      const job = await this.getJob(jobId, { signal });
      const status = job?.data?.status;

      if (["SUCCEEDED", "FAILED", "CANCELLED"].includes(status)) return job;
      if (Date.now() - startedAt >= timeoutMs) {
        throw new OptiForgeError(`Timed out waiting for solve job ${jobId}`, {
          code: "JOB_TIMEOUT",
        });
      }

      await delay(intervalMs, signal);
    }
  }

  async #request(path, { method = "GET", body, routingKey, signal } = {}) {
    const headers = {
      accept: "application/json",
      "x-api-key": this.apiKey,
    };

    if (body !== undefined) headers["content-type"] = "application/json";
    if (routingKey) headers["x-optiforge-routing-key"] = routingKey;

    let response;
    try {
      response = await this.fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (cause) {
      throw new OptiForgeError("Could not reach the OptiForge API", {
        code: "NETWORK_ERROR",
        details: cause,
      });
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new OptiForgeError(
        payload?.message ?? `OptiForge API returned HTTP ${response.status}`,
        {
          status: response.status,
          code: payload?.code ?? "HTTP_ERROR",
          details: payload,
        },
      );
    }

    return payload;
  }
}

function assertModelKey(modelKey) {
  if (!/^[a-z][a-z0-9-]{2,47}$/.test(modelKey)) {
    throw new TypeError(
      "modelKey must start with a lowercase letter and contain 3-48 lowercase letters, numbers, or hyphens",
    );
  }
}

function assertSolveInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object");
  }
  if (!input.data || typeof input.data !== "object" || Array.isArray(input.data)) {
    throw new TypeError("input.data must be an object");
  }
}

function assertIdentifier(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} is required`);
  }
}

function delay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
