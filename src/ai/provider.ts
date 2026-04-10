import { openAiStyleShellPlanResponseFormat, shellPlanJsonSchema, shellPlanSchema, type ShellPlan } from "./schema.js";
import type { ProvidersConfig } from "../config/types.js";
import type { PromptContext } from "../shell/context.js";
import { buildSystemPrompt, buildUserPrompt } from "./prompts.js";

export interface PlanGenerationRequest {
  input: string;
  context: PromptContext;
  feedback?: string;
}

export interface InterpretationRequest {
  prompt: string;
  command: string;
  output: string;
  exitCode: number;
  cwd: string;
}

export interface LlmProvider {
  readonly name: string;
  generatePlan(request: PlanGenerationRequest): Promise<ShellPlan>;
  interpretResult(request: InterpretationRequest): Promise<string>;
}

export function createProvider(config: ProvidersConfig): LlmProvider {
  switch (config.selected) {
    case "openrouter":
      return new OpenRouterProvider(config.openrouter);
    case "openai":
      return new OpenAiProvider(config.openai);
    case "anthropic":
      return new AnthropicProvider(config.anthropic);
    case "gemini":
      return new GeminiProvider(config.gemini);
    case "ollama":
      return new OllamaProvider(config.ollama);
  }
}

class OpenRouterProvider implements LlmProvider {
  public readonly name = "openrouter";

  public constructor(private readonly config: ProvidersConfig["openrouter"]) {}

  public async generatePlan(request: PlanGenerationRequest): Promise<ShellPlan> {
    assertConfigured(this.config.apiKey, "OpenRouter API key");

    const data = await postJson<OpenAiStyleResponse>(`${trimTrailingSlash(this.config.baseUrl)}/chat/completions`, {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: {
        model: this.config.model,
        temperature: this.config.temperature,
        response_format: openAiStyleShellPlanResponseFormat,
        messages: buildOpenAiMessages(request),
      },
    });

    return parseShellPlanPayload(extractOpenAiMessageContent(data), "OpenRouter");
  }

  public async interpretResult(request: InterpretationRequest): Promise<string> {
    return await interpretWithOpenAiStyle(this.config, "OpenRouter", request);
  }
}

class OpenAiProvider implements LlmProvider {
  public readonly name = "openai";

  public constructor(private readonly config: ProvidersConfig["openai"]) {}

  public async generatePlan(request: PlanGenerationRequest): Promise<ShellPlan> {
    assertConfigured(this.config.apiKey, "OpenAI API key");

    const data = await postJson<OpenAiStyleResponse>(`${trimTrailingSlash(this.config.baseUrl)}/chat/completions`, {
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.config.apiKey}`,
      },
      body: {
        model: this.config.model,
        temperature: this.config.temperature,
        response_format: openAiStyleShellPlanResponseFormat,
        messages: buildOpenAiMessages(request),
      },
    });

    return parseShellPlanPayload(extractOpenAiMessageContent(data), "OpenAI");
  }

  public async interpretResult(request: InterpretationRequest): Promise<string> {
    return await interpretWithOpenAiStyle(this.config, "OpenAI", request);
  }
}

class AnthropicProvider implements LlmProvider {
  public readonly name = "anthropic";

  public constructor(private readonly config: ProvidersConfig["anthropic"]) {}

  public async generatePlan(request: PlanGenerationRequest): Promise<ShellPlan> {
    assertConfigured(this.config.apiKey, "Anthropic API key");

    const data = await postJson<AnthropicResponse>(`${trimTrailingSlash(this.config.baseUrl)}/messages`, {
      headers: {
        "content-type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": this.config.apiVersion,
      },
      body: {
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: `${buildSystemPrompt(request.context)}\nReturn only raw JSON that matches the requested schema exactly.`,
        messages: [
          {
            role: "user",
            content: buildUserPrompt(request.input, request.context, request.feedback),
          },
        ],
      },
    });

    const text = data.content?.find((item) => item.type === "text")?.text ?? "";
    return parseShellPlanPayload(text, "Anthropic");
  }

  public async interpretResult(request: InterpretationRequest): Promise<string> {
    assertConfigured(this.config.apiKey, "Anthropic API key");

    const data = await postJson<AnthropicResponse>(`${trimTrailingSlash(this.config.baseUrl)}/messages`, {
      headers: {
        "content-type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": this.config.apiVersion,
      },
      body: {
        model: this.config.model,
        max_tokens: Math.min(this.config.maxTokens, 600),
        temperature: 0.1,
        system: buildInterpretSystemPrompt(),
        messages: [
          {
            role: "user",
            content: buildInterpretUserPrompt(request),
          },
        ],
      },
    });

    return extractPlainAnthropicText(data, "Anthropic");
  }
}

class GeminiProvider implements LlmProvider {
  public readonly name = "gemini";

  public constructor(private readonly config: ProvidersConfig["gemini"]) {}

  public async generatePlan(request: PlanGenerationRequest): Promise<ShellPlan> {
    assertConfigured(this.config.apiKey, "Gemini API key");

    const data = await postJson<GeminiResponse>(
      `${trimTrailingSlash(this.config.baseUrl)}/models/${encodeURIComponent(this.config.model)}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`,
      {
        headers: {
          "content-type": "application/json",
        },
        body: {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${buildSystemPrompt(request.context)}\n\n${buildUserPrompt(request.input, request.context, request.feedback)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: this.config.temperature,
            responseMimeType: "application/json",
            responseJsonSchema: shellPlanJsonSchema,
          },
        },
      },
    );

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    return parseShellPlanPayload(text, "Gemini");
  }

  public async interpretResult(request: InterpretationRequest): Promise<string> {
    assertConfigured(this.config.apiKey, "Gemini API key");

    const data = await postJson<GeminiResponse>(
      `${trimTrailingSlash(this.config.baseUrl)}/models/${encodeURIComponent(this.config.model)}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`,
      {
        headers: {
          "content-type": "application/json",
        },
        body: {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${buildInterpretSystemPrompt()}\n\n${buildInterpretUserPrompt(request)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
          },
        },
      },
    );

    return extractPlainGeminiText(data, "Gemini");
  }
}

class OllamaProvider implements LlmProvider {
  public readonly name = "ollama";

  public constructor(private readonly config: ProvidersConfig["ollama"]) {}

  public async generatePlan(request: PlanGenerationRequest): Promise<ShellPlan> {
    assertConfigured(this.config.model, "Ollama model");

    const data = await postJson<OllamaResponse>(`${trimTrailingSlash(this.config.baseUrl)}/chat`, {
      headers: {
        "content-type": "application/json",
      },
      body: {
        model: this.config.model,
        stream: false,
        format: shellPlanJsonSchema,
        options: {
          temperature: this.config.temperature,
        },
        messages: buildOpenAiMessages(request),
      },
    });

    return parseShellPlanPayload(data.message?.content ?? "", "Ollama");
  }

  public async interpretResult(request: InterpretationRequest): Promise<string> {
    assertConfigured(this.config.model, "Ollama model");

    const data = await postJson<OllamaResponse>(`${trimTrailingSlash(this.config.baseUrl)}/chat`, {
      headers: {
        "content-type": "application/json",
      },
      body: {
        model: this.config.model,
        stream: false,
        options: {
          temperature: 0.1,
        },
        messages: [
          {
            role: "system",
            content: buildInterpretSystemPrompt(),
          },
          {
            role: "user",
            content: buildInterpretUserPrompt(request),
          },
        ],
      },
    });

    return extractPlainOllamaText(data, "Ollama");
  }
}

function buildOpenAiMessages(request: PlanGenerationRequest) {
  return [
    {
      role: "system",
      content: buildSystemPrompt(request.context),
    },
    {
      role: "user",
      content: buildUserPrompt(request.input, request.context, request.feedback),
    },
  ];
}

function extractOpenAiMessageContent(data: OpenAiStyleResponse): string | null {
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item.text ?? "")
      .join("")
      .trim();
  }

  return null;
}

function parseShellPlanPayload(payload: string | null, providerName: string): ShellPlan {
  const trimmed = payload?.trim() ?? "";
  if (!trimmed) {
    throw new Error(`${providerName} returned an empty response.`);
  }

  const direct = tryParseJson(trimmed);
  if (direct) {
    return shellPlanSchema.parse(direct);
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const recovered = tryParseJson(trimmed.slice(start, end + 1));
    if (recovered) {
      return shellPlanSchema.parse(recovered);
    }
  }

  throw new Error(`${providerName} returned invalid JSON for the shell plan schema.`);
}

async function interpretWithOpenAiStyle(
  config: ProvidersConfig["openrouter"] | ProvidersConfig["openai"],
  providerName: string,
  request: InterpretationRequest,
): Promise<string> {
  assertConfigured(config.apiKey, `${providerName} API key`);

  const data = await postJson<OpenAiStyleResponse>(`${trimTrailingSlash(config.baseUrl)}/chat/completions`, {
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: {
      model: config.model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: buildInterpretSystemPrompt(),
        },
        {
          role: "user",
          content: buildInterpretUserPrompt(request),
        },
      ],
    },
  });

  return extractPlainOpenAiText(data, providerName);
}

function tryParseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function postJson<T>(url: string, input: { headers: Record<string, string>; body: unknown }): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: input.headers,
    body: JSON.stringify(input.body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Provider request failed with status ${response.status}: ${errorBody}`);
  }

  return (await response.json()) as T;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function assertConfigured(value: string, label: string): void {
  if (!value.trim()) {
    throw new Error(`${label} is not configured. Run \`opsh --init\` and save it in ~/.opsh/config.json.`);
  }
}

function buildInterpretSystemPrompt(): string {
  return [
    "You are opsh warp mode.",
    "The command has already run. Interpret the result for the user.",
    "Be concise and practical.",
    "Answer the user's request directly and stop.",
    "Do not add follow-up suggestions, next steps, recommendations, or extra offers of help.",
    "Do not repeat the full command output unless necessary.",
    "If the command failed, briefly say that it failed and why if the output makes that clear.",
  ].join("\n");
}

function buildInterpretUserPrompt(request: InterpretationRequest): string {
  return [
    `Original user request: ${request.prompt}`,
    `Executed command: ${request.command}`,
    `Exit code: ${request.exitCode}`,
    `Working directory after command: ${request.cwd}`,
    "Command output:",
    truncateForInterpretation(request.output),
  ].join("\n");
}

function truncateForInterpretation(output: string): string {
  const trimmed = output.trim();
  if (trimmed.length <= 8000) {
    return trimmed || "(no output)";
  }

  return `${trimmed.slice(0, 8000)}\n...[truncated]`;
}

function extractPlainOpenAiText(data: OpenAiStyleResponse, providerName: string): string {
  const content = extractOpenAiMessageContent(data)?.trim();
  if (!content) {
    throw new Error(`${providerName} returned an empty interpretation response.`);
  }
  return content;
}

function extractPlainAnthropicText(data: AnthropicResponse, providerName: string): string {
  const text = data.content?.find((item) => item.type === "text")?.text?.trim();
  if (!text) {
    throw new Error(`${providerName} returned an empty interpretation response.`);
  }
  return text;
}

function extractPlainGeminiText(data: GeminiResponse, providerName: string): string {
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) {
    throw new Error(`${providerName} returned an empty interpretation response.`);
  }
  return text;
}

function extractPlainOllamaText(data: OllamaResponse, providerName: string): string {
  const text = data.message?.content?.trim();
  if (!text) {
    throw new Error(`${providerName} returned an empty interpretation response.`);
  }
  return text;
}

interface OpenAiStyleResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

interface AnthropicResponse {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface OllamaResponse {
  message?: {
    content?: string;
  };
}
