import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const llmsIndexUrl = "https://docs.wizzx.ai/llms.txt";
const llmsFullUrl = "https://docs.wizzx.ai/llms-full.txt";
const openapiUrl = "https://docs.wizzx.ai/api-reference/openapi.json";
const englishGuideUrl =
  "https://docs.wizzx.ai/ai-tools/media-generation-agents.md";
const chineseGuideUrl =
  "https://docs.wizzx.ai/zh/ai-tools/media-generation-agents.md";

const agentGuideEntrypoints = {
  "ai-tools/media-generation-agents.mdx": [
    llmsIndexUrl,
    llmsFullUrl,
    englishGuideUrl,
    openapiUrl,
  ],
  "zh/ai-tools/media-generation-agents.mdx": [
    chineseGuideUrl,
    llmsIndexUrl,
    llmsFullUrl,
    openapiUrl,
  ],
};

for (const [relativePath, entrypoints] of Object.entries(
  agentGuideEntrypoints,
)) {
  const page = await readFile(`${root}/${relativePath}`, "utf8");
  for (const entrypoint of entrypoints) {
    assert.ok(
      page.includes(entrypoint),
      `${relativePath} does not reference ${entrypoint}`,
    );
  }
}

if (process.argv.includes("--live")) {
  const urls = [
    llmsIndexUrl,
    llmsFullUrl,
    englishGuideUrl,
    chineseGuideUrl,
    openapiUrl,
  ];
  const responses = await Promise.all(urls.map((url) => fetch(url)));
  for (const [index, response] of responses.entries()) {
    assert.equal(
      response.status,
      200,
      `${urls[index]} returned ${response.status}`,
    );
  }

  const llmsIndex = await responses[0].text();
  assert.ok(
    llmsIndex.includes(englishGuideUrl),
    "llms.txt does not list the English agent guide",
  );
  assert.ok(
    llmsIndex.includes(openapiUrl),
    "llms.txt does not list the OpenAPI document",
  );

  const llmsFull = await responses[1].text();
  assert.ok(
    llmsFull.includes("# Generate media with AI agents"),
    "llms-full.txt does not contain the agent guide",
  );

  const chineseGuide = await responses[3].text();
  assert.ok(
    chineseGuide.includes("# 在 AI 智能体中生成图片和视频"),
    "Chinese Markdown guide did not render expected content",
  );
}

console.log(
  `Agent documentation entrypoints verified${process.argv.includes("--live") ? " locally and online" : " locally"}.`,
);
