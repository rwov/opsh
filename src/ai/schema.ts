import { z } from "zod";

export const shellPlanSchema = z.object({
  mode: z.enum(["command", "question", "refuse"]),
  userIntent: z.string().min(1),
  command: z.string(),
  explanation: z.string().min(1),
  risk: z.enum(["safe", "caution", "dangerous"]),
  assumptions: z.array(z.string()),
  needsConfirmation: z.boolean(),
  shouldAutoExecute: z.boolean(),
});

export type ShellPlan = z.infer<typeof shellPlanSchema>;

export const shellPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    mode: {
      type: "string",
      enum: ["command", "question", "refuse"],
    },
    userIntent: {
      type: "string",
    },
    command: {
      type: "string",
    },
    explanation: {
      type: "string",
    },
    risk: {
      type: "string",
      enum: ["safe", "caution", "dangerous"],
    },
    assumptions: {
      type: "array",
      items: {
        type: "string",
      },
    },
    needsConfirmation: {
      type: "boolean",
    },
    shouldAutoExecute: {
      type: "boolean",
    },
  },
  required: [
    "mode",
    "userIntent",
    "command",
    "explanation",
    "risk",
    "assumptions",
    "needsConfirmation",
    "shouldAutoExecute",
  ],
} as const;

export const openAiStyleShellPlanResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "shell_plan",
    strict: true,
    schema: shellPlanJsonSchema,
  },
} as const;
