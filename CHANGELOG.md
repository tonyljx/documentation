# Changelog

## 2026-09-04

### Changed

- Removed the two retired ElevenLabs TTS models from the bilingual public catalog, pricing, navigation, model and endpoint pages, agent guidance, and generated OpenAPI documentation while leaving dated history intact.
- Added cross-repository model-offboarding rules so future backend availability changes include a complete public-documentation audit.

## 2026-08-18

### Added

- Added `veo3_lite` to the existing Veo 3.1 submit API, including 720p, 1080p, and 4K request schemas, examples, bilingual guides, and agent-safe JSON Schema/OpenAPI entrypoints.
- Documented profitable fixed per-video customer pricing based on Kie's current costs: Lite 180/210/900 credits and Fast 360/390/1080 credits for 720p/1080p/4K.

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
