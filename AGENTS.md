# Repository Guidelines

## Config

- Every time you add a new page, run `mint broken-links` to check out broken links and fix

## Project Structure & Module Organization

- Root config lives in `docs.json`; keep navigation, theme colors (`primary` orange palette), and branding (`logo/`, `favicon.svg`) in sync with page additions.
- Top-level guides include `index.mdx`, `quickstart.mdx`, and `development.mdx`; topical content sits under `essentials/` and `ai-tools/`.
- API docs live in `api-reference/`, with endpoint examples in `api-reference/endpoint/`; update page slugs to match filenames.
- Reusable snippets belong in `snippets/`; shared assets go in `images/` and `logo/`. Avoid orphan files—every new page should be linked from `docs.json` navigation.

## Build, Test, and Development Commands

- Install the Mintlify CLI (one time): `npm i -g mint`.
- Preview locally from the repo root: `mint dev` (serves at `http://localhost:3000`, hot reloads on save).
- Refresh the CLI if preview misbehaves: `mint update`.
- Rely on the preview to catch MDX or navigation issues before pushing.

## Coding Style & Naming Conventions

- Write pages in MDX with YAML frontmatter containing `title` and `description` (use double quotes). Start content with a level-2 `##` heading.
- Use kebab-case filenames (e.g., `api-reference/endpoint/create.mdx`) and PascalCase for Mintlify components (`<Card>`, `<Columns>`, `<Accordion>`).
- Keep paragraphs short, prefer lists for steps, and use Mintlify components for structure over raw HTML. Links and anchors should be relative to the docs root.

## Testing Guidelines

- Run `mint dev` and manually click through navigation groups defined in `docs.json` to confirm anchors and tabs render.
- Check the console for MDX warnings and ensure code blocks use the intended language tag.
- Validate new assets resolve from `images/` or `logo/` and that imported snippets exist under `snippets/`.

## Commit & Pull Request Guidelines

- Follow Conventional Commit prefixes seen in history (`feat`, `chore`, etc.) with concise, present-tense summaries.
- PRs should note which pages changed, navigation updates in `docs.json`, and any new assets/snippets. Include a local preview URL or screenshots when UI changes are visible.
- Keep changes atomic: one feature or doc topic per PR; describe any deviations (e.g., drive-by fixes) explicitly.

## Security & Configuration Tips

- Do not commit secrets or tokens; links in `docs.json` should use public destinations only.
- Align new brand colors with the existing orange palette unless intentionally re-theming, and verify contrast in the preview.
- Review external embeds or iframes for mixed content and sandboxing needs before inclusion.
