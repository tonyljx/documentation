# Changelog

## 2026-09-30

### Added

- Added bilingual GPT Image 2.5 (`gpt-image-2.5`) model and endpoint pages, navigation, pricing rows (1K/2K/4K = 13/21/32 credits per image), agent-guide mention, and the `GPTImage25SubmitRequest` OpenAPI schema and submit path.
- Added bilingual Seedream 5.0 Pro (`seedream-5-pro`, ByteDance) model and endpoint pages, navigation, home cards, pricing rows (1K/1.5K = 44, 2K = 89 credits per image), changelog entry, agent-guide mention, and the `Seedream5ProSubmitRequest` OpenAPI schema and submit path (one reference image max, 10 aspect ratios plus `auto`, JPEG/PNG output).
- Documented the `model_unavailable` 503 error code, including when not to retry.
- Added bilingual model and endpoint pages, navigation, home cards, pricing rows, agent-guide coverage, OpenAPI schemas, and manifest entries for Kling v3 (`kling-v3`), Kling v3 Omni (`kling-v3-omni`), Seedance 2.0 Mini (`seedance-2.0-mini`), PixVerse V6 (`pixverse-v6`), Grok Imagine Video 1.5 (`grok-imagine-video-1.5`), Gemini Omni Flash (`gemini-omni-flash`), Wan 2.6 Flash (`wan-2.6-flash`), Qwen Image 2.0 / 2.0 Pro (`qwen-image-2.0`, `qwen-image-2.0-pro`, shared `QwenImage2SubmitRequest`), and Suno (`suno`, first public music model, new Audio Generation navigation group).
- Documented Veo 3.1 Quality (`veo3_quality`): 1,924 / 1,924 / 2,885 credits per video at 720p / 1080p / 4K, 6 or 8 seconds only, no reference-to-video. The OpenAPI schema, agent JSON Schema snippet, bilingual Veo pages, and pricing were updated.
- Extended `scripts/check-openapi-contract.mjs` with assertions for every new schema, the Veo Quality branch, and the now-public `seedream-5-pro` (previously asserted absent).

### Changed

- The hidden legacy `wan-2-6` endpoint now documents 720p only (97 credits/s) in its bilingual pages and in the generated OpenAPI schema/examples; 1080p is no longer offered.
- The Veo 3.1 guide's empty Sources section now links to Google DeepMind.

### Removed

- Took Runway Gen-3 (`runway-gen3`) off every current public surface after the backend stopped accepting new submissions (HTTP 503 `model_unavailable`) and hid it from `/pricing`: English and Chinese model and endpoint pages, navigation, home cards, pricing tables, agent guides, and the generated OpenAPI path and schema. `runway-gen3` is now a retired key in the OpenAPI manifest. Dated changelog history is preserved.

## 2026-09-04

### Changed

- Removed the two retired ElevenLabs TTS models from the bilingual public catalog, pricing, navigation, model and endpoint pages, agent guidance, and generated OpenAPI documentation while leaving dated history intact.
- Added cross-repository model-offboarding rules so future backend availability changes include a complete public-documentation audit.

## 2026-08-18

### Added

- Added `veo3_lite` to the existing Veo 3.1 submit API, including 720p, 1080p, and 4K request schemas, examples, bilingual guides, and agent-safe JSON Schema/OpenAPI entrypoints.
- Documented profitable fixed per-video customer pricing for Veo 3.1: Lite 180/210/900 credits and Fast 360/390/1080 credits for 720p/1080p/4K.

### Changed

- Corrected Veo billing from the stale per-second presentation to the backend's model-and-resolution fixed request tiers; 4/6/8-second duration no longer multiplies the displayed charge.
- Updated reference-to-video guidance for current Fast/Lite support while retaining the 8-second validation rule and Wizzx task polling lifecycle.

## 2026-08-17

### Added

- Added English and Chinese guides for generating images and videos from Codex, Claude Code, and other shell-capable agents with one Wizzx API key.
- Documented strict `gpt-image-2` and `veo3` request schemas, safe parameter construction, asynchronous Task ID polling, terminal states, and duplicate-submission safeguards.
- Added machine-readable OpenAPI request schemas and endpoint pages for every public model, plus `/pricing` and credit balance endpoints.

### Changed

- Aligned the OpenAPI submit, status, success, and error schemas with the backend contract, including six client-visible task states and Wizzx API key authentication.
- Corrected current public endpoint parameter names, required fields, enum values, runtime limitations, and high-risk pricing examples for Veo, Seedance, Kling, Seedream, Nano Banana Pro, and ElevenLabs TTS.
- Added visible `llms.txt`, `llms-full.txt`, Markdown, and OpenAPI entrypoints to the bilingual agent guides, plus local and live checks that keep those references verifiable.

## 2026-08-11

### Fixed

- Fixed all 5 broken internal links reported by `mint broken-links`: the error-codes pages (en/zh) now point to the pricing page for the list of available models instead of the non-existent `api-reference/introduction`, and the leftover Mintlify template pages under `essentials/` now link to the official Mintlify docs (`image-embeds`, `api-playground/overview`) instead of dead relative paths.
- Localized the Pricing / Changelog / Introduction navigation anchors per language. The shared `navigation.global.anchors` in `docs.json` was split into language-specific `global` blocks: the English view keeps the original labels and links, while the Chinese view now shows 定价 / 更新日志 / 介绍 pointing to the existing translated pages under `zh/`.
