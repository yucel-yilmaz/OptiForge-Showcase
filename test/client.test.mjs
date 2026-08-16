import assert from "node:assert/strict";
import test from "node:test";
import { OptiForgeClient, OptiForgeError } from "../src/index.js";

test("solve sends the documented headers and payload", async () => {
  let captured;
  const client = new OptiForgeClient({
    baseUrl: "https://demo.example.com/",
    apiKey: "test-key",
    fetch: async (url, options) => {
      captured = { url, options };
      return Response.json({ data: { status: "optimal" } });
    },
  });

  const result = await client.solve(
    "field-service-assignment",
    { data: { resources: [], tasks: [] } },
    { routingKey: "customer-42" },
  );

  assert.equal(
    captured.url,
    "https://demo.example.com/api/v1/models/field-service-assignment/solve",
  );
  assert.equal(captured.options.method, "POST");
  assert.equal(captured.options.headers["x-api-key"], "test-key");
  assert.equal(
    captured.options.headers["x-optiforge-routing-key"],
    "customer-42",
  );
  assert.deepEqual(JSON.parse(captured.options.body), {
    data: { resources: [], tasks: [] },
  });
  assert.equal(result.data.status, "optimal");
});

test("API errors retain status, code, and response details", async () => {
  const client = new OptiForgeClient({
    baseUrl: "https://demo.example.com",
    apiKey: "test-key",
    fetch: async () =>
      Response.json(
        { code: "INVALID_API_KEY", message: "The API key is invalid." },
        { status: 401 },
      ),
  });

  await assert.rejects(
    () => client.getJob("job-1"),
    (error) => {
      assert.ok(error instanceof OptiForgeError);
      assert.equal(error.status, 401);
      assert.equal(error.code, "INVALID_API_KEY");
      return true;
    },
  );
});

test("waitForJob polls until a terminal state", async () => {
  const states = ["QUEUED", "RUNNING", "SUCCEEDED"];
  const client = new OptiForgeClient({
    baseUrl: "https://demo.example.com",
    apiKey: "test-key",
    fetch: async () => Response.json({ data: { status: states.shift() } }),
  });

  const result = await client.waitForJob("job-1", {
    intervalMs: 0,
    timeoutMs: 1_000,
  });

  assert.equal(result.data.status, "SUCCEEDED");
  assert.equal(states.length, 0);
});

test("invalid model keys fail before a network request", async () => {
  const client = new OptiForgeClient({
    baseUrl: "https://demo.example.com",
    apiKey: "test-key",
    fetch: async () => assert.fail("fetch should not be called"),
  });

  await assert.rejects(
    () => client.solve("Invalid key", { data: {} }),
    /modelKey must start/,
  );
});
