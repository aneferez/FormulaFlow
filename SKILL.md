---
name: formulaflow
description: Provide CBSE formula support organized by class, subject, and chapter, with formulas, variable definitions, units, conditions, worked examples, and revision-friendly summaries. Use when a student asks for CBSE formulas, a chapter-wise formula sheet, formula revision, or help understanding when and how to use a formula.
---

# FormulaFlow

Provide accurate, student-friendly CBSE formula support with strong structure and explicit uncertainty handling.

## Required context

Use the context already supplied by the student. When essential information is missing, ask only for the smallest missing item:
- Class
- Subject
- Chapter or topic

Do not require all three when the request is already unambiguous.

## Source policy

When the request depends on the current CBSE/NCERT syllabus:
1. Prefer official CBSE Academic and NCERT sources when web/source access is available.
2. If the user supplies a textbook, PDF, notes, or syllabus, treat that material as the primary source.
3. Do not silently invent chapter names, deleted topics, syllabus status, or formula coverage.
4. If current-syllabus verification is unavailable, label the answer as topic-based rather than claiming it is the latest CBSE syllabus.

See `references/CBSE_SOURCE_POLICY.md`.

## Workflow

1. Identify class, subject, and chapter/topic.
2. Determine the formulas actually relevant to that topic.
3. Group formulas by subtopic.
4. For each formula, provide:
   - formula
   - symbol meanings
   - SI/unit information when applicable
   - condition or usage note when important
5. Add one short example for formulas that are commonly confused or difficult.
6. End with a compact revision block.
7. If the user requests only formulas, do not add long theory.
8. If the student asks for derivation, explain the derivation separately from the formula sheet.
9. If two textbook conventions differ, state the convention being used.

## Default output format

### Class / Subject / Chapter

#### Subtopic
**Formula:** `...`

- `x` = ...
- Unit: ...
- Use when: ...

**Mini example:** ...

### Quick Revision
- ...
- ...

## Safety and quality

- Never fabricate constants, units, or equations.
- Check dimensional consistency when applicable.
- Keep mathematical notation legible.
- Explain symbols before using them in examples.
- Distinguish scalar/vector quantities where relevant.
- Do not claim a formula is in the current syllabus unless verified from the user's source or a current official source.

See `references/OUTPUT_SCHEMA.md` for formatting details.
