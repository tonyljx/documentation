import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { legacyModelKeys, publicModels } from "./openapi-model-manifest.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const openapi = JSON.parse(
  await readFile(`${root}/api-reference/openapi.json`, "utf8"),
);
const docsNavigation = JSON.parse(await readFile(`${root}/docs.json`, "utf8"));

const publicModelKeys = publicModels.map(({ modelKey }) => modelKey);

for (const modelKey of publicModelKeys) {
  const operation = openapi.paths[`/api/v1/task/submit/${modelKey}`]?.post;
  assert.ok(operation, `missing submit operation for ${modelKey}`);
  assert.equal(
    operation.deprecated,
    undefined,
    `${modelKey} must not be deprecated`,
  );
  assert.equal(
    operation.responses["200"].content["application/json"].schema.$ref,
    "#/components/schemas/TaskSubmitResponse",
    `${modelKey} must use the shared submit response`,
  );
}

for (const modelKey of legacyModelKeys) {
  const operation = openapi.paths[`/api/v1/task/submit/${modelKey}`]?.post;
  assert.ok(
    operation,
    `missing explicitly retained legacy operation for ${modelKey}`,
  );
  assert.equal(operation.deprecated, true, `${modelKey} must be deprecated`);
}
const knownModelKeys = new Set([...publicModelKeys, ...legacyModelKeys]);
for (const path of Object.keys(openapi.paths)) {
  if (!path.startsWith("/api/v1/task/submit/")) continue;
  assert.ok(
    knownModelKeys.has(path.split("/").at(-1)),
    `unexpected submit path exposed in OpenAPI: ${path}`,
  );
}

assert.ok(openapi.paths["/pricing"]?.get, "missing GET /pricing");
assert.ok(
  openapi.paths["/api/v1/credits/balance"]?.get,
  "missing GET /api/v1/credits/balance",
);
assert.deepEqual(openapi.components.schemas.TaskSubmitResponse.required, [
  "code",
  "message",
  "data",
  "request_id",
]);
assert.deepEqual(openapi.components.schemas.ErrorDetail.required, [
  "message",
  "type",
  "param",
  "code",
]);
assert.ok(
  openapi.paths["/api/v1/task/submit/veo3"].post.responses["413"],
  "submit operations must document the body-size error",
);

assert.deepEqual(
  openapi.components.schemas.TaskStatusData.properties.status.enum,
  ["PENDING", "QUEUED", "PROCESSING", "REVIEW_REQUIRED", "SUCCEEDED", "FAILED"],
);
assert.equal(
  openapi.components.schemas.TaskStatusData.properties.status.enum.includes(
    "DISPATCHING",
  ),
  false,
  "internal DISPATCHING must not be public",
);

const veo = openapi.components.schemas.Veo3SubmitRequest;
assert.deepEqual(veo.required, ["prompt", "type"]);
assert.deepEqual(veo.properties.model.enum, ["veo3_fast"]);
assert.deepEqual(veo.properties.duration.enum, [4, 6, 8]);
assert.deepEqual(veo.properties.resolution.enum, ["720p"]);
assert.equal(veo.allOf[0].oneOf.length, 3);
const veoReferenceMode = veo.allOf[0].oneOf[2];
assert.deepEqual(veoReferenceMode.properties.duration.enum, [8]);
assert.deepEqual(veoReferenceMode.properties.aspect_ratio.enum, ["16:9"]);

const kling = openapi.components.schemas.KlingSubmitRequest;
assert.ok(kling.required.includes("quality_mode"));
assert.ok(kling.properties.model_name.enum.includes("kling-v2-1-master"));
assert.equal(
  kling.properties.model_name.enum.includes("kling-v2-master"),
  false,
);
assert.equal(kling.allOf[0].oneOf.length, 2);
assert.equal(
  kling.allOf[0].oneOf[0].properties.model_name.enum.includes("kling-v1-5"),
  false,
  "kling-v1-5 must not validate for text-to-video",
);
assert.equal(kling.allOf[0].oneOf[1].allOf.length, 3);
assert.equal(kling.allOf[1].oneOf.length, 2);
assert.equal(kling.allOf[2].oneOf.length, 2);

const seedance = openapi.components.schemas.SeedanceSubmitRequest;
assert.equal(seedance.properties.resolution.enum.includes("480p"), false);
assert.equal(seedance.allOf[0].oneOf.length, 2);
const seedance15 = openapi.components.schemas.Seedance15ProSubmitRequest;
assert.equal(seedance15.properties.duration.minimum, 4);
assert.deepEqual(seedance15.properties.resolution.enum, ["720p"]);
assert.equal(seedance15.allOf[0].oneOf.length, 2);

const runway = openapi.components.schemas.RunwayGen3SubmitRequest;
assert.equal(runway.allOf[0].oneOf.length, 2);
assert.deepEqual(runway.properties.fps.enum, [24, 30, 60]);

assert.equal(
  openapi.components.securitySchemes.bearerAuth.bearerFormat,
  undefined,
  "Wizzx API keys must not be described as JWTs",
);

const serializedNavigation = JSON.stringify(docsNavigation);
for (const page of [
  "api-reference/endpoint/pricing",
  "api-reference/endpoint/credit-balance",
  "api-reference/endpoint/submit-runway-gen3",
  "api-reference/endpoint/submit-nano-banana-2",
  "api-reference/endpoint/submit-nano-banana-2-lite",
  "api-reference/endpoint/submit-gpt-image-2",
  "zh/api-reference/endpoint/pricing",
  "zh/api-reference/endpoint/credit-balance",
  "zh/api-reference/endpoint/submit-runway-gen3",
  "zh/api-reference/endpoint/submit-nano-banana-2",
  "zh/api-reference/endpoint/submit-nano-banana-2-lite",
  "zh/api-reference/endpoint/submit-gpt-image-2",
]) {
  assert.ok(
    serializedNavigation.includes(page),
    `missing navigation page ${page}`,
  );
}

let frontmatterOperations = 0;
for (const directory of [
  "api-reference/endpoint",
  "zh/api-reference/endpoint",
]) {
  for (const filename of (await readdir(`${root}/${directory}`)).filter(
    (name) => name.endsWith(".mdx"),
  )) {
    const page = await readFile(`${root}/${directory}/${filename}`, "utf8");
    const match = page.match(/^openapi:\s*"(GET|POST) ([^"]+)"/m);
    if (!match) continue;
    frontmatterOperations++;
    assert.ok(
      openapi.paths[match[2]]?.[match[1].toLowerCase()],
      `missing OpenAPI operation for ${directory}/${filename}`,
    );
  }
}

let jsonBlocks = 0;
for (const directory of [
  "models",
  "zh/models",
  "api-reference/endpoint",
  "zh/api-reference/endpoint",
  "ai-tools",
  "zh/ai-tools",
  "snippets",
]) {
  for (const filename of (await readdir(`${root}/${directory}`)).filter(
    (name) => name.endsWith(".mdx"),
  )) {
    const page = await readFile(`${root}/${directory}/${filename}`, "utf8");
    for (const match of page.matchAll(/```json[^\n]*\n([\s\S]*?)\n```/g)) {
      jsonBlocks++;
      assert.doesNotThrow(
        () => JSON.parse(match[1]),
        `invalid JSON block in ${directory}/${filename}`,
      );
    }
  }
}

const publicModelPages = [
  "seedream.mdx",
  "nano-banana-pro.mdx",
  "nano-banana.mdx",
  "nano-banana-2.mdx",
  "nano-banana-2-lite.mdx",
  "gpt-image-2.mdx",
  "runway-gen3.mdx",
  "veo-3-1.mdx",
  "seedance-pro-fast.mdx",
  "seedance-1.5-pro.mdx",
  "kling-ai.mdx",
  "eleven-labs-tts-v2.mdx",
  "eleven-labs-tts-turbo-25.mdx",
];
for (const localePrefix of ["models", "zh/models"]) {
  for (const filename of publicModelPages) {
    const page = await readFile(`${root}/${localePrefix}/${filename}`, "utf8");
    assert.equal(
      /"code": 0,\s*\n\s*"data"/.test(page),
      false,
      `${localePrefix}/${filename} contains an incomplete success envelope`,
    );
    for (const staleValue of [
      "task_123456789",
      '"code": 200',
      '"status": "pending"',
      '"status": "succeeded"',
    ]) {
      assert.equal(
        page.includes(staleValue),
        false,
        `${localePrefix}/${filename} contains stale response value ${staleValue}`,
      );
    }
  }
}

for (const relativePath of [
  "models/nano-banana.mdx",
  "zh/models/nano-banana.mdx",
]) {
  const page = await readFile(`${root}/${relativePath}`, "utf8");
  assert.equal(
    page.includes("10-20"),
    false,
    `${relativePath} has stale Pro pricing`,
  );
  assert.ok(
    page.includes("108 / 108 / 144"),
    `${relativePath} lacks current Pro pricing`,
  );
}
for (const relativePath of ["models/seedream.mdx", "zh/models/seedream.mdx"]) {
  const page = await readFile(`${root}/${relativePath}`, "utf8");
  assert.equal(
    page.includes("+5"),
    false,
    `${relativePath} charges for input references`,
  );
}
for (const relativePath of [
  "models/runway-gen3.mdx",
  "zh/models/runway-gen3.mdx",
]) {
  const page = await readFile(`${root}/${relativePath}`, "utf8");
  assert.ok(page.includes("`fps`"), `${relativePath} does not document fps`);
}

console.log(
  `OpenAPI contract verified: ${publicModelKeys.length} public model schemas, ${frontmatterOperations} endpoint bindings, and ${jsonBlocks} JSON examples.`,
);
