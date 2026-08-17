# Changelog

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
