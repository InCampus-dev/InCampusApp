# InCampus Final Report

This folder contains the final deliverable for `Group project - Final report`.

The single authored content source is:

- `final-report.md`

The generated PDF deliverable is:

- `final-report.pdf`

Everything related to the report stays inside `docs/final-report/`.

## Structure

- `assets/logo/` stores the InCampus wordmark used on the cover.
- `assets/diagrams/` stores original project diagrams and recovered report media.
- `assets/tables/` stores the exported full source tables used in the appendices.
- `assets/test-evidence/` stores local QA output excerpts and GitHub Actions CLI evidence.
- `assets/report.css` styles the print-ready HTML.
- `temp/markitdown/` stores raw text extraction from the earlier reports.
- `temp/` stores build scripts, extracted XML helpers, and intermediate HTML.

## Primary Sources

The rebuild uses:

1. `Documentation/INcampusFILES/` as the primary exported Affine workspace source.
2. The previous requirements and object-oriented design reports.
3. Current repository documentation and implementation evidence.
4. Verified local QA and GitHub Actions CLI evidence.

During this run, live Affine MCP resources were explicitly checked but were not exposed in the session tool/resource layer. The local Affine exports therefore served as the available primary Affine source. Missing standalone visuals such as DFD/ERD/class/component/activity diagrams were recovered from the original DOCX media packages rather than replaced with invented summary diagrams.

## Regeneration

From the repository root:

```sh
node docs/final-report/temp/build-final-report.mjs
node docs/final-report/temp/render-report.mjs
node docs/final-report/temp/print-report-via-cdp.mjs
```

The steps are:

- `build-final-report.mjs` composes the final long-form Markdown from the authored narrative plus the exported full appendix tables.
- `render-report.mjs` converts the Markdown into a styled HTML document.
- `print-report-via-cdp.mjs` prints the HTML to PDF through the Brave DevTools protocol with browser headers/footers disabled.

## Extraction Notes

The intended extraction tool was MarkItDown. In the earlier pass, MarkItDown installation was blocked, so the intermediate extraction files in `temp/markitdown/` were created with macOS `textutil`.

Additional original diagrams were recovered by extracting media from:

- `report-v1.3.docx`
- `Object-Oriented Design Report.docx`

The helper XML files in `temp/` were used only to map those media assets back to their captions and nearby text.

## Verification

The report references the following verified QA commands:

```sh
npm test --workspace backend
npm test --workspace mobile
npm run lint --workspace backend
npm run typecheck --workspace mobile
```

Verified results:

- Backend: `31` test files, `260` tests passed.
- Mobile: `5` test files, `20` tests passed.
- Combined automated tests: `280` passed.

GitHub Actions evidence is included as raw authenticated CLI excerpts in:

- `assets/test-evidence/github-actions-cli-evidence.txt`

## Validation Checklist

Before submission:

```sh
test -f docs/final-report/final-report.md
test -f docs/final-report/final-report.pdf
rg -i "dating app" docs/final-report/final-report.md docs/final-report/temp/final-report.html
```

The report should pass these conditions:

- one table of contents only;
- no visible cover date;
- original project diagrams only;
- relative image paths only;
- no artificial GitHub Actions cards;
- full tables preserved in appendices.
