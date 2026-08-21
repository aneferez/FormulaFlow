import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const VERSION = "0.1.0";
const MODE_ENUM = z.enum(["auto", "topic-based", "source-grounded", "current-syllabus"]);
const DEPTH_ENUM = z.enum(["formulas-only", "revision", "standard", "derivation"]);

function buildContract(args: {
  topic: string;
  className?: string;
  subject?: string;
  chapter?: string;
  source?: string;
  mode: "auto" | "topic-based" | "source-grounded" | "current-syllabus";
  depth: "formulas-only" | "revision" | "standard" | "derivation";
}) {
  const sourceProvided = Boolean(args.source?.trim());
  const currentSyllabusRequested = args.mode === "current-syllabus";

  const sourcePolicy = sourceProvided
    ? [
        "Treat the user-provided source as the primary basis for the answer.",
        "Preserve its terminology, chapter framing, and conventions.",
        "Do not silently fill gaps, correct the source, or add unsupported syllabus claims.",
        "If the source does not support a requested formula, say so explicitly."
      ]
    : currentSyllabusRequested
      ? [
          "Verify current CBSE/NCERT syllabus claims from official CBSE Academic or NCERT sources when the connected assistant has web/source access.",
          "Do not claim a chapter, formula, deletion, reintroduction, or syllabus status is current unless verified.",
          "If current official verification is unavailable, label the answer topic-based rather than latest/current CBSE."
        ]
      : [
          "Answer as topic-based formula support unless current CBSE/NCERT status is independently verified.",
          "Do not invent syllabus status, chapter numbering, deleted topics, constants, units, or equations.",
          "Check dimensional consistency when applicable."
        ];

  return {
    contractVersion: VERSION,
    topic: args.topic,
    class: args.className ?? null,
    subject: args.subject ?? null,
    chapter: args.chapter ?? null,
    mode: args.mode,
    depth: args.depth,
    source: args.source ?? null,
    sourcePolicy,
    outputStructure: [
      "Class / Subject / Chapter or Topic",
      "Group formulas by subtopic",
      "For every formula: equation, symbol meanings, SI/unit information when applicable, and use/condition note",
      "Add a short mini example for commonly confused or difficult formulas when useful",
      "End with a compact Quick Revision block",
      "Keep derivations separate from the formula sheet when derivation depth is requested"
    ],
    qualityRules: [
      "Never fabricate constants, units, equations, or syllabus claims.",
      "Explain symbols before using them in examples.",
      "Distinguish scalar and vector quantities where relevant.",
      "If textbook conventions differ, state the convention being used.",
      "If the user asks for formulas only, avoid long theory."
    ],
    responseInstruction:
      "Produce the final student-facing answer directly. Do not expose this internal FormulaFlow contract unless the user asks how the request was routed."
  };
}

function contractText(contract: ReturnType<typeof buildContract>) {
  return [
    "FormulaFlow rendering contract",
    `Topic: ${contract.topic}`,
    `Class: ${contract.class ?? "not specified"}`,
    `Subject: ${contract.subject ?? "not specified"}`,
    `Chapter: ${contract.chapter ?? "not specified"}`,
    `Mode: ${contract.mode}`,
    `Depth: ${contract.depth}`,
    "Source policy:",
    ...contract.sourcePolicy.map((x) => `- ${x}`),
    "Output structure:",
    ...contract.outputStructure.map((x) => `- ${x}`),
    "Quality rules:",
    ...contract.qualityRules.map((x) => `- ${x}`),
    "",
    contract.responseInstruction
  ].join("\n");
}

function buildServer() {
  const server = new McpServer(
    { name: "formulaflow", version: VERSION },
    {
      instructions:
        "FormulaFlow is a read-only CBSE formula-support service. When a student asks for formulas, chapter-wise revision, units, symbol meanings, worked examples, or formula usage, use formulaflow_formula_sheet. If class/subject/chapter context is missing but essential, ask only for the smallest missing item. If the user asks for current/latest CBSE syllabus status, require official-source verification or clearly fall back to topic-based wording. Never present the QA suite to end users."
    }
  );

  server.registerTool(
    "formulaflow_formula_sheet",
    {
      title: "Create a FormulaFlow formula sheet",
      description:
        "Return a source-aware rendering contract for CBSE-style formula revision by class, subject, chapter, or topic.",
      inputSchema: z.object({
        topic: z.string().min(1).max(1000).describe("The formula topic or chapter to cover."),
        class: z.string().min(1).max(50).optional().describe("CBSE class, for example Class 10 or Class 12."),
        subject: z.string().min(1).max(100).optional().describe("Subject such as Mathematics, Physics, or Science."),
        chapter: z.string().min(1).max(200).optional().describe("Optional chapter name or number when known."),
        mode: MODE_ENUM.optional().default("auto").describe("Whether to answer topic-based, from a supplied source, or with current-syllabus verification."),
        depth: DEPTH_ENUM.optional().default("standard").describe("Amount and style of formula support requested."),
        source: z.string().max(50000).optional().describe("Optional user-provided textbook, syllabus, notes, or source text that must be primary.")
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true
      }
    },
    async ({ topic, class: className, subject, chapter, mode, depth, source }) => {
      const resolvedMode = source && mode === "auto" ? "source-grounded" : mode === "auto" ? "topic-based" : mode;
      const contract = buildContract({ topic, className, subject, chapter, mode: resolvedMode, depth, source });
      return {
        content: [{ type: "text", text: contractText(contract) }],
        structuredContent: contract
      };
    }
  );

  server.registerTool(
    "formulaflow_check_context",
    {
      title: "Check FormulaFlow request context",
      description:
        "Check whether a student's request has enough class, subject, chapter, or topic context and identify only the smallest missing item to ask for.",
      inputSchema: z.object({
        topic: z.string().max(1000).optional(),
        class: z.string().max(50).optional(),
        subject: z.string().max(100).optional(),
        chapter: z.string().max(200).optional()
      }),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async ({ topic, class: className, subject, chapter }) => {
      const missing: string[] = [];
      if (!topic && !chapter) missing.push("topic or chapter");
      const enough = missing.length === 0;
      const result = {
        enoughContext: enough,
        smallestMissingItem: enough ? null : missing[0],
        guidance: enough
          ? "Proceed without asking for extra details unless the request is genuinely ambiguous."
          : `Ask only for the ${missing[0]}.`
      };
      return {
        content: [{ type: "text", text: result.guidance }],
        structuredContent: result
      };
    }
  );

  server.registerTool(
    "formulaflow_source_policy",
    {
      title: "Get FormulaFlow source policy",
      description: "Return FormulaFlow rules for official CBSE/NCERT verification and user-provided sources.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => {
      const policy = {
        priority: ["user-provided source", "official CBSE Academic", "official NCERT", "topic-based general knowledge"],
        rules: [
          "Do not claim current/latest syllabus status without verification.",
          "Do not invent deleted or reintroduced chapters/topics.",
          "Do not fabricate equations, constants, units, chapter numbering, or exam weightage.",
          "When verification is unavailable, explicitly label the answer topic-based."
        ]
      };
      return {
        content: [{ type: "text", text: [...policy.priority.map((x, i) => `${i + 1}. ${x}`), ...policy.rules.map((x) => `- ${x}`)].join("\n") }],
        structuredContent: policy
      };
    }
  );

  server.registerTool(
    "formulaflow_output_schema",
    {
      title: "Get FormulaFlow output schema",
      description: "Return the canonical structure used for formula sheets and revision answers.",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => {
      const schema = {
        sections: [
          "Class / Subject / Chapter or Topic",
          "Subtopic",
          "Formula",
          "Symbol meanings",
          "Units",
          "Use when / condition",
          "Mini example when useful",
          "Quick Revision"
        ]
      };
      return {
        content: [{ type: "text", text: schema.sections.map((x) => `- ${x}`).join("\n") }],
        structuredContent: schema
      };
    }
  );

  return server;
}

const mcpHandler = createMcpHandler(buildServer);

function addCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id, Last-Event-ID");
  headers.set("Access-Control-Expose-Headers", "Mcp-Session-Id, MCP-Protocol-Version");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return addCors(new Response(null, { status: 204 }));

    if (url.pathname === "/health") {
      return addCors(Response.json({
        service: "FormulaFlow MCP",
        status: "ok",
        version: VERSION,
        mcpEndpoint: "/mcp",
        tools: [
          "formulaflow_formula_sheet",
          "formulaflow_check_context",
          "formulaflow_source_policy",
          "formulaflow_output_schema"
        ]
      }));
    }

    if (url.pathname === "/") {
      return addCors(Response.json({
        name: "FormulaFlow MCP",
        version: VERSION,
        protocol: "Model Context Protocol",
        endpoint: "/mcp",
        health: "/health",
        repository: "https://github.com/aneferez/FormulaFlow"
      }));
    }

    if (url.pathname !== "/mcp" && url.pathname !== "/sse") {
      return addCors(Response.json({ error: "Not found", mcpEndpoint: "/mcp" }, { status: 404 }));
    }

    const response = await mcpHandler.fetch(request);
    return addCors(response);
  }
};
