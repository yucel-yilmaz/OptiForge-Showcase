import { readFile } from "node:fs/promises";
import { OptiForgeClient } from "../src/index.js";

const baseUrl = process.env.OPTIFORGE_BASE_URL;
const apiKey = process.env.OPTIFORGE_API_KEY;

if (!baseUrl || !apiKey) {
  console.error(
    "Set OPTIFORGE_BASE_URL and OPTIFORGE_API_KEY before running this example.",
  );
  process.exitCode = 1;
} else {
  const exampleUrl = new URL("./field-service-assignment.json", import.meta.url);
  const specification = JSON.parse(await readFile(exampleUrl, "utf8"));
  const client = new OptiForgeClient({ baseUrl, apiKey });

  const result = await client.solve("field-service-assignment", {
    data: specification.data,
    solveOptions: specification.solveOptions,
  });

  console.log(JSON.stringify(result, null, 2));
}
