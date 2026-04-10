import type { ShellPlan } from "./schema.js";
import type { LlmProvider } from "./provider.js";
import type { PromptContext } from "../shell/context.js";

export async function generateShellPlan(input: {
  provider: LlmProvider;
  prompt: string;
  context: PromptContext;
  feedback?: string;
}): Promise<ShellPlan> {
  return input.provider.generatePlan({
    input: input.prompt,
    context: input.context,
    feedback: input.feedback,
  });
}
