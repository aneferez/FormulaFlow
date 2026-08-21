# FormulaFlow MCP Server

This folder contains the public, stateless MCP runtime for FormulaFlow.

## Tools

- `formulaflow_formula_sheet` — returns a source-aware rendering contract for formula revision.
- `formulaflow_check_context` — identifies only the smallest missing context item when needed.
- `formulaflow_source_policy` — returns the CBSE/NCERT verification rules.
- `formulaflow_output_schema` — returns the canonical student-facing formula-sheet structure.

## Endpoints

- `/mcp` — primary MCP endpoint
- `/sse` — compatibility alias
- `/health` — health response
- `/` — service metadata

## Deployment

The Worker is configured as `formulaflow-mcp` for Cloudflare Workers. GitHub Actions deploys it using repository secrets named `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Source discipline

FormulaFlow must not claim that a chapter, formula, deletion, reintroduction, chapter number, or exam status is part of the current CBSE syllabus unless verified from a user-supplied source or a current official CBSE Academic/NCERT source. If that verification is unavailable, the answer must be labeled topic-based.

The runtime stores no user data and requires no external AI API key.
