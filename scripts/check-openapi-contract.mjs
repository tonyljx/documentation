import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  legacyModelKeys,
  publicModels,
  retiredModelKeys,
} from "./openapi-model-manifest.mjs";

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
assert.deepEqual(veo.properties.model.enum, [
  "veo3_fast",
  "veo3_lite",
  "veo3_quality",
]);
assert.deepEqual(veo.properties.duration.enum, [4, 6, 8]);
assert.deepEqual(veo.properties.resolution.enum, ["720p", "1080p", "4k"]);
assert.equal(veo.allOf[0].oneOf.length, 3);
const veoReferenceMode = veo.allOf[0].oneOf[2];
assert.deepEqual(veoReferenceMode.properties.duration.enum, [8]);
assert.equal(veoReferenceMode.properties.aspect_ratio, undefined);
const veoQualityMode = veo.allOf[1].oneOf[1];
assert.deepEqual(veoQualityMode.properties.model.enum, ["veo3_quality"]);
assert.deepEqual(veoQualityMode.properties.duration.enum, [6, 8]);
assert.equal(
  veoQualityMode.properties.type.enum.includes("reference-to-video"),
  false,
  "veo3_quality must not accept reference-to-video",
);

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

const gptImage25 = openapi.components.schemas.GPTImage25SubmitRequest;
assert.deepEqual(gptImage25.required, ["prompt"]);
assert.deepEqual(gptImage25.properties.version.enum, ["flare", "sunburst"]);
assert.equal(gptImage25.properties.image_urls.maxItems, 16);
assert.deepEqual(gptImage25.properties.resolution.enum, ["1K", "2K", "4K"]);
assert.equal(gptImage25.properties.aspect_ratio.enum.length, 11);
for (const field of ["quality", "output_format", "n", "background"]) {
  assert.equal(
    gptImage25.properties[field],
    undefined,
    `gpt-image-2.5 must not accept ${field}`,
  );
}

const schemas = openapi.components.schemas;
const klingV3 = schemas.KlingV3SubmitRequest;
assert.deepEqual(klingV3.properties.resolution.enum, ["720p", "1080p"]);
assert.equal(klingV3.properties.duration.minimum, 3);
assert.equal(klingV3.properties.duration.maximum, 15);
assert.equal(klingV3.allOf[0].oneOf.length, 2);
const klingV3Omni = schemas.KlingV3OmniSubmitRequest;
assert.equal(klingV3Omni.allOf[0].oneOf.length, 3);
assert.equal(klingV3Omni.allOf[0].oneOf[2].properties.image_urls.maxItems, 7);
const seedance20Mini = schemas.Seedance20MiniSubmitRequest;
assert.deepEqual(seedance20Mini.properties.resolution.enum, ["480p", "720p"]);
assert.equal(seedance20Mini.properties.generate_audio.default, true);
const pixverse = schemas.PixverseV6SubmitRequest;
assert.deepEqual(pixverse.properties.resolution.enum, [
  "360p",
  "540p",
  "720p",
  "1080p",
]);
assert.ok(
  pixverse.allOf[0].oneOf[1].not.required.includes("aspect_ratio"),
  "pixverse-v6 image-to-video must reject aspect_ratio",
);
const grok = schemas.GrokImagineVideo15SubmitRequest;
assert.deepEqual(grok.required, ["prompt"]);
assert.equal(grok.properties.image_urls.maxItems, 7);
assert.equal(grok.properties.duration.minimum, 6);
const geminiOmni = schemas.GeminiOmniFlashSubmitRequest;
assert.deepEqual(geminiOmni.properties.duration.enum, [4, 6, 8, 10]);
assert.deepEqual(geminiOmni.properties.resolution.enum, [
  "720p",
  "1080p",
  "4k",
]);
const wanFlash = schemas.Wan26FlashSubmitRequest;
assert.deepEqual(wanFlash.required, ["image_urls"]);
assert.equal(wanFlash.properties.image_urls.maxItems, 1);
for (const field of ["audio", "audio_url"]) {
  assert.equal(
    wanFlash.properties[field],
    undefined,
    `wan-2.6-flash must not accept ${field}`,
  );
}
const suno = schemas.SunoSubmitRequest;
assert.deepEqual(suno.properties.version.enum, ["v6", "v6-wild", "v6-mini"]);
assert.equal(suno.allOf[0].oneOf.length, 2);
const qwenImage2 = schemas.QwenImage2SubmitRequest;
assert.equal(qwenImage2.properties.image_urls.maxItems, 3);
assert.deepEqual(qwenImage2.properties.resolution.enum, ["1K", "2K"]);
assert.deepEqual(
  schemas.Wan26SubmitRequest.properties.resolution.enum,
  ["720p"],
  "legacy wan-2-6 must no longer publish 1080p",
);
assert.ok(
  openapi.paths["/api/v1/task/submit/seedream-5-pro"]?.post,
  "seedream-5-pro must be public",
);
const seedream5Pro = schemas.Seedream5ProSubmitRequest;
assert.deepEqual(seedream5Pro.required, ["prompt"]);
assert.equal(seedream5Pro.properties.image_urls.maxItems, 1);
assert.deepEqual(seedream5Pro.properties.resolution.enum, ["1K", "1.5K", "2K"]);
assert.equal(seedream5Pro.properties.resolution.default, "1K");
assert.deepEqual(seedream5Pro.properties.output_format.enum, ["jpeg", "png"]);
assert.equal(seedream5Pro.properties.aspect_ratio.enum.length, 11);
assert.equal(seedream5Pro.properties.aspect_ratio.default, "auto");
for (const field of ["n", "batch_size", "size", "watermark"]) {
  assert.equal(
    seedream5Pro.properties[field],
    undefined,
    `seedream-5-pro must not accept ${field}`,
  );
}

for (const modelKey of retiredModelKeys) {
  assert.equal(
    openapi.paths[`/api/v1/task/submit/${modelKey}`],
    undefined,
    `retired model ${modelKey} must not be published in OpenAPI`,
  );
}
assert.equal(
  openapi.components.schemas.RunwayGen3SubmitRequest,
  undefined,
  "retired Runway Gen-3 schema must not be published",
);

assert.equal(
  openapi.components.securitySchemes.bearerAuth.bearerFormat,
  undefined,
  "Wizzx API keys must not be described as JWTs",
);

const serializedNavigation = JSON.stringify(docsNavigation);
for (const page of [
  "api-reference/endpoint/pricing",
  "api-reference/endpoint/credit-balance",
  "api-reference/endpoint/submit-nano-banana-2",
  "api-reference/endpoint/submit-nano-banana-2-lite",
  "api-reference/endpoint/submit-gpt-image-2",
  "api-reference/endpoint/submit-gpt-image-2-5",
  "api-reference/endpoint/submit-kling-v3",
  "api-reference/endpoint/submit-kling-v3-omni",
  "api-reference/endpoint/submit-seedance-2-0-mini",
  "api-reference/endpoint/submit-pixverse-v6",
  "api-reference/endpoint/submit-grok-imagine-video-1-5",
  "api-reference/endpoint/submit-gemini-omni-flash",
  "api-reference/endpoint/submit-wan-2-6-flash",
  "api-reference/endpoint/submit-suno",
  "api-reference/endpoint/submit-qwen-image-2-0",
  "api-reference/endpoint/submit-qwen-image-2-0-pro",
  "api-reference/endpoint/submit-seedream-5-pro",
  "zh/api-reference/endpoint/pricing",
  "zh/api-reference/endpoint/credit-balance",
  "zh/api-reference/endpoint/submit-nano-banana-2",
  "zh/api-reference/endpoint/submit-nano-banana-2-lite",
  "zh/api-reference/endpoint/submit-gpt-image-2",
  "zh/api-reference/endpoint/submit-gpt-image-2-5",
  "zh/api-reference/endpoint/submit-kling-v3",
  "zh/api-reference/endpoint/submit-kling-v3-omni",
  "zh/api-reference/endpoint/submit-seedance-2-0-mini",
  "zh/api-reference/endpoint/submit-pixverse-v6",
  "zh/api-reference/endpoint/submit-grok-imagine-video-1-5",
  "zh/api-reference/endpoint/submit-gemini-omni-flash",
  "zh/api-reference/endpoint/submit-wan-2-6-flash",
  "zh/api-reference/endpoint/submit-suno",
  "zh/api-reference/endpoint/submit-qwen-image-2-0",
  "zh/api-reference/endpoint/submit-qwen-image-2-0-pro",
  "zh/api-reference/endpoint/submit-seedream-5-pro",
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
  "gpt-image-2-5.mdx",
  "veo-3-1.mdx",
  "seedance-pro-fast.mdx",
  "seedance-1.5-pro.mdx",
  "kling-ai.mdx",
  "kling-v3.mdx",
  "kling-v3-omni.mdx",
  "seedance-2-0-mini.mdx",
  "pixverse-v6.mdx",
  "grok-imagine-video-1-5.mdx",
  "gemini-omni-flash.mdx",
  "wan-2-6-flash.mdx",
  "suno.mdx",
  "qwen-image-2.mdx",
  "seedream-5-pro.mdx",
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
const serializedDocsConfig = JSON.stringify(docsNavigation);
for (const retiredKey of retiredModelKeys) {
  assert.equal(
    serializedDocsConfig.includes(retiredKey),
    false,
    `docs.json still references retired model ${retiredKey}`,
  );
}

console.log(
  `OpenAPI contract verified: ${publicModelKeys.length} public model schemas, ${frontmatterOperations} endpoint bindings, and ${jsonBlocks} JSON examples.`,
);
