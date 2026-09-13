# Loupe design system

## Context

Loupe is a thoughtful developer tool for inspecting pull requests and repositories. It should feel precise, human, calm, and trustworthy rather than flashy or automated for its own sake.

## Direction

Full visual overhaul, informed by Impeccable and Taste Skill's guidance on hierarchy, purposeful layouts, restrained motion, accessibility, and non-generic visual language. Custom editorial marketing system with familiar developer-tool workspace patterns. Visual variance: 5/10; motion: 2/10; density: 4/10 marketing, 6/10 workspace.

## Foundations

- Warm white paper, charcoal headings, earthy muted neutrals.
- Warm orange brand accent; darker orange buttons for readable white labels.
- Green and amber are semantic review/configuration indicators, not arbitrary feature colors.
- Manrope for headings and brand; DM Sans for interface and body. Self-hosted font files.
- 7px button radius, 9–12px panels, thin neutral borders, restrained shadows.
- Large purposeful whitespace, editorial two-line headings, strong left alignment in the app.
- Dark mode: every hardcoded color was lifted into generated CSS variables
  (`scripts/build-dark-theme.mjs`) with an auto-mapped dark palette; theme is
  OS-preference by default with a persisted manual toggle in the nav/sidebar.

## Behavior

- The hero review is an explicit interactive example, never represented as a real scan.
- No fake users, fake usage metrics, or seeded reviews in the workspace.
- Hero tabs update the example; applying a suggestion only affects the example.
- The real scan modal uses a native dialog and keyboard focus. Results, limits, errors and provider availability are explicit.
- Hover motion is small; reduced-motion preferences disable transitions and animation.
- The workspace collapses to a mobile drawer. Tables/list rows retain primary actions without horizontal overflow.

## Keep

Lowercase loupe wordmark, inspection icon, warm orange accent, contextual diff language, privacy-forward product copy, candid coverage disclosures.
