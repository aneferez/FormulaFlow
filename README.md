# FormulaFlow

FormulaFlow is a reusable Agent Skill for structured CBSE formula revision and explanation.

## What it does

It organizes formula support by class, subject, and chapter/topic and can provide:
- formula sheets
- symbol definitions
- units
- usage conditions
- concise worked examples
- quick revision summaries
- source-aware syllabus handling

## Why it exists

Students often need formulas in a predictable revision format rather than a long theory answer. FormulaFlow standardizes that workflow while avoiding unverified claims about the latest CBSE syllabus.

## Skill structure

```text
formulaflow/
├── SKILL.md
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── references/
│   ├── CBSE_SOURCE_POLICY.md
│   └── OUTPUT_SCHEMA.md
├── examples/
│   └── sample-prompts.md
└── evals/
    └── cases.md
```

## Agent Skills compatibility

The package follows the Agent Skills `SKILL.md` convention with required YAML metadata and supporting resources.

## Example

```text
Class 10 Physics: give me a concise electricity formula sheet with units.
```

## Status

Initial public-repository version. Formula datasets should be expanded only with source-verified CBSE/NCERT material.

## License

MIT
