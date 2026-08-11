# Changelog

## 2026-08-11

### Fixed

- Fixed all 5 broken internal links reported by `mint broken-links`: the error-codes pages (en/zh) now point to the pricing page for the list of available models instead of the non-existent `api-reference/introduction`, and the leftover Mintlify template pages under `essentials/` now link to the official Mintlify docs (`image-embeds`, `api-playground/overview`) instead of dead relative paths.
- Localized the Pricing / Changelog / Introduction navigation anchors per language. The shared `navigation.global.anchors` in `docs.json` was split into language-specific `global` blocks: the English view keeps the original labels and links, while the Chinese view now shows 定价 / 更新日志 / 介绍 pointing to the existing translated pages under `zh/`.
