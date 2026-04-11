import os from "node:os";
import path from "node:path";
import prompts from "prompts";
import pc from "picocolors";
import type { OpshConfig, ProviderType } from "./types.js";
import {
  ensureDir,
  fileExists,
  readJsonFile,
  writeJsonFile,
} from "../utils/fs.js";

const CONFIG_DIR = path.join(os.homedir(), ".opsh");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

const PROVIDER_CHOICES: Array<{ title: string; value: ProviderType }> = [
  { title: "OpenRouter", value: "openrouter" },
  { title: "OpenAI API", value: "openai" },
  { title: "Anthropic API", value: "anthropic" },
  { title: "Gemini (Google AI API)", value: "gemini" },
  { title: "Ollama (local)", value: "ollama" },
];

const MODEL_CATALOG: Record<
  ProviderType,
  Array<{
    label: string;
    value: string;
    hint: string;
  }>
> = {
  openrouter: [
    {
      label: "Auto Router",
      value: "openrouter/auto",
      hint: "OpenRouter picks a strong model automatically",
    },
    {
      label: "Claude Haiku 4.5",
      value: "anthropic/claude-haiku-4.5",
      hint: "Strong default for small tasks, like opsh generation",
    },
    {
      label: "GPT-5.4 Mini",
      value: "openai/gpt-5.4-mini",
      hint: "Latest flagship GPT-5 mini model",
    },
    {
      label: "Gemini 2.5 Flash",
      value: "google/gemini-2.5-flash",
      hint: "Fast price-performance option",
    },
  ],
  openai: [
    {
      label: "GPT-5.4 Mini",
      value: "gpt-5.4-mini",
      hint: "Latest flagship GPT-5 mini model",
    },
    {
      label: "GPT-5 mini",
      value: "gpt-5-mini",
      hint: "Older, lower-cost GPT-5 mini model",
    },
    {
      label: "GPT-5 nano",
      value: "gpt-5-nano",
      hint: "Smallest low-cost GPT-5 family model",
    },
  ],
  anthropic: [
    {
      label: "Claude Opus 4.1",
      value: "claude-opus-4-1-20250805",
      hint: "Most capable Anthropic model",
    },
    {
      label: "Claude Haiku 4.5",
      value: "claude-sonnet-4-20250514",
      hint: "Balanced high-performance default",
    },
    {
      label: "Claude Sonnet 3.7",
      value: "claude-3-7-sonnet-20250219",
      hint: "Earlier reasoning-heavy Sonnet release",
    },
    {
      label: "Claude Haiku 3.5",
      value: "claude-3-5-haiku-20241022",
      hint: "Fastest Anthropic option",
    },
  ],
  gemini: [
    {
      label: "Gemini 2.5 Pro",
      value: "gemini-2.5-pro",
      hint: "Best for harder coding and reasoning",
    },
    {
      label: "Gemini 2.5 Flash",
      value: "gemini-2.5-flash",
      hint: "Best price-performance default",
    },
    {
      label: "Gemini 2.5 Flash-Lite",
      value: "gemini-2.5-flash-lite",
      hint: "Lowest-latency lower-cost option",
    },
  ],
  ollama: [
    {
      label: "Qwen3 Coder",
      value: "qwen3-coder",
      hint: "Strong local coding model",
    },
    {
      label: "GPT-OSS 20B",
      value: "gpt-oss:20b",
      hint: "Strong general-purpose local model",
    },
    {
      label: "GPT-OSS 120B",
      value: "gpt-oss:120b",
      hint: "Largest GPT-OSS local model",
    },
    {
      label: "DeepSeek R1",
      value: "deepseek-r1:latest",
      hint: "Reasoning-focused local model",
    },
  ],
};

const CUSTOM_MODEL_VALUE = "__custom_model__";

export function getConfigPath(): string {
  return CONFIG_PATH;
}

export function createDefaultConfig(): OpshConfig {
  return {
    version: 1,
    shell: undefined,
    printOnly: false,
    warpMode: false,
    confirmByDefault: true,
    historyLimit: 100,
    recentContextLimit: 8,
    provider: {
      selected: "openai",
      openrouter: {
        model: "openrouter/auto",
        baseUrl: "https://openrouter.ai/api/v1",
        apiKey: "",
        temperature: 0.1,
      },
      openai: {
        model: "gpt-5.1",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "",
        temperature: 0.1,
      },
      anthropic: {
        model: "claude-sonnet-4-20250514",
        baseUrl: "https://api.anthropic.com/v1",
        apiKey: "",
        temperature: 0.1,
        apiVersion: "2023-06-01",
        maxTokens: 1200,
      },
      gemini: {
        model: "gemini-2.5-flash",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        apiKey: "",
        temperature: 0.1,
      },
      ollama: {
        model: "qwen3-coder",
        baseUrl: "http://localhost:11434/api",
        temperature: 0.1,
      },
    },
  };
}

export async function saveConfig(config: OpshConfig): Promise<void> {
  await ensureDir(CONFIG_DIR);
  await writeJsonFile(CONFIG_PATH, config);
}

export async function loadConfig(): Promise<{
  config: OpshConfig;
  created: boolean;
  path: string;
}> {
  await ensureDir(CONFIG_DIR);

  if (!(await fileExists(CONFIG_PATH))) {
    const config = createDefaultConfig();
    await saveConfig(config);
    return { config, created: true, path: CONFIG_PATH };
  }

  const config = await readJsonFile<OpshConfig>(CONFIG_PATH);
  return { config: normalizeConfig(config), created: false, path: CONFIG_PATH };
}

export async function initConfigInteractively(
  existing?: OpshConfig,
): Promise<OpshConfig> {
  const base = existing ?? createDefaultConfig();

  const answers = await prompts(buildOnboardingPrompts(base), {
    onCancel: () => {
      throw new Error("Configuration bootstrap cancelled.");
    },
  });

  const providerType = selectedProvider(answers, base);
  const warpMode = Boolean(answers.warpMode ?? base.warpMode);
  const confirmByDefault = warpMode
    ? false
    : Boolean(answers.confirmByDefault ?? base.confirmByDefault);
  const next: OpshConfig = {
    version: 1,
    shell: undefined,
    printOnly: false,
    warpMode,
    confirmByDefault,
    historyLimit: base.historyLimit,
    recentContextLimit: 8,
    provider: {
      ...base.provider,
      selected: providerType,
      openrouter:
        providerType === "openrouter"
          ? {
              ...base.provider.openrouter,
              model: resolveAnsweredModel(answers, base.provider.openrouter.model),
              baseUrl: defaultBaseUrlForProvider("openrouter"),
              apiKey: String(answers.apiKey ?? base.provider.openrouter.apiKey),
              temperature: base.provider.openrouter.temperature,
            }
          : base.provider.openrouter,
      openai:
        providerType === "openai"
          ? {
              ...base.provider.openai,
              model: resolveAnsweredModel(answers, base.provider.openai.model),
              baseUrl: defaultBaseUrlForProvider("openai"),
              apiKey: String(answers.apiKey ?? base.provider.openai.apiKey),
              temperature: base.provider.openai.temperature,
            }
          : base.provider.openai,
      anthropic:
        providerType === "anthropic"
          ? {
              ...base.provider.anthropic,
              model: resolveAnsweredModel(answers, base.provider.anthropic.model),
              baseUrl: defaultBaseUrlForProvider("anthropic"),
              apiKey: String(answers.apiKey ?? base.provider.anthropic.apiKey),
              temperature: base.provider.anthropic.temperature,
              apiVersion: base.provider.anthropic.apiVersion,
              maxTokens: base.provider.anthropic.maxTokens,
            }
          : base.provider.anthropic,
      gemini:
        providerType === "gemini"
          ? {
              ...base.provider.gemini,
              model: resolveAnsweredModel(answers, base.provider.gemini.model),
              baseUrl: defaultBaseUrlForProvider("gemini"),
              apiKey: String(answers.apiKey ?? base.provider.gemini.apiKey),
              temperature: base.provider.gemini.temperature,
            }
          : base.provider.gemini,
      ollama:
        providerType === "ollama"
          ? {
              ...base.provider.ollama,
              model: resolveAnsweredModel(answers, base.provider.ollama.model),
              baseUrl: defaultBaseUrlForProvider("ollama"),
              temperature: base.provider.ollama.temperature,
            }
          : base.provider.ollama,
    },
  };

  await saveConfig(next);
  return next;
}

export async function editConfigInteractively(
  existing: OpshConfig,
): Promise<OpshConfig> {
  let draft = normalizeConfig(existing);

  while (true) {
    const action = await prompts(
      {
        type: "select",
        name: "action",
        message: "Config editor",
        choices: buildConfigEditorChoices(draft),
        initial: 0,
      },
      {
        onCancel: () => {
          throw new Error("Config editing cancelled.");
        },
      },
    );

    if (action.action === "done") {
      await saveConfig(draft);
      return draft;
    }

    if (action.action === "warp") {
      const answer = await prompts(
        {
          type: "confirm",
          name: "warpMode",
          message:
            "Enable warp mode by default? Warp auto-runs safer commands and answers from the result.",
          initial: draft.warpMode,
        },
        { onCancel: () => ({ warpMode: draft.warpMode }) },
      );
      draft = {
        ...draft,
        warpMode: Boolean(answer.warpMode ?? draft.warpMode),
        confirmByDefault: Boolean(answer.warpMode ?? draft.warpMode)
          ? false
          : draft.confirmByDefault,
      };
      continue;
    }

    if (action.action === "confirm") {
      const answer = await prompts(
        {
          type: draft.warpMode ? null : "confirm",
          name: "confirmByDefault",
          message: "Require confirmation before execution?",
          initial: draft.confirmByDefault,
        },
        { onCancel: () => ({ confirmByDefault: draft.confirmByDefault }) },
      );
      draft = {
        ...draft,
        confirmByDefault: draft.warpMode
          ? false
          : Boolean(answer.confirmByDefault ?? draft.confirmByDefault),
      };
      continue;
    }

    if (action.action === "provider") {
      const providerAnswers = await promptProviderSelection(draft);
      draft = applyProviderAnswers(draft, providerAnswers);
      continue;
    }

    if (action.action === "model") {
      const providerType = draft.provider.selected;
      const answer = await promptModelSelection(
        `Model for ${providerLabel(providerType)}`,
        providerType,
        getProviderDraft(draft, providerType).model,
      );
      draft = applyProviderAnswers(draft, {
        providerType,
        model: answer,
      });
      continue;
    }

    if (action.action === "apiKey") {
      if (draft.provider.selected === "ollama") {
        continue;
      }

      const providerType = draft.provider.selected;
      const answer = await prompts(
        {
          type: "password",
          name: "apiKey",
          message: `API key for ${providerLabel(providerType)} (stored in ~/.opsh/config.json)`,
          initial: getProviderApiKey(draft, providerType),
        },
        {
          onCancel: () => ({ apiKey: getProviderApiKey(draft, providerType) }),
        },
      );
      draft = applyProviderAnswers(draft, {
        providerType,
        apiKey: answer.apiKey ?? getProviderApiKey(draft, providerType),
      });
    }
  }
}

function normalizeConfig(config: OpshConfig): OpshConfig {
  const defaults = createDefaultConfig();

  return {
    version: 1,
    shell:
      config.shell === "zsh" || config.shell === "bash"
        ? config.shell
        : defaults.shell,
    printOnly: config.printOnly ?? defaults.printOnly,
    warpMode: config.warpMode ?? defaults.warpMode,
    confirmByDefault: config.confirmByDefault ?? defaults.confirmByDefault,
    historyLimit: Number.isFinite(config.historyLimit)
      ? config.historyLimit
      : defaults.historyLimit,
    recentContextLimit: Number.isFinite(config.recentContextLimit)
      ? config.recentContextLimit
      : defaults.recentContextLimit,
    provider: normalizeProviders(config.provider, defaults.provider),
  };
}

function normalizeProviders(
  config: OpshConfig["provider"] | undefined,
  defaults: OpshConfig["provider"],
): OpshConfig["provider"] {
  return {
    selected: isProviderType(config?.selected)
      ? config.selected
      : defaults.selected,
    openrouter: {
      model: config?.openrouter?.model ?? defaults.openrouter.model,
      baseUrl:
        config?.openrouter?.baseUrl ?? defaultBaseUrlForProvider("openrouter"),
      apiKey: config?.openrouter?.apiKey ?? defaults.openrouter.apiKey,
      temperature:
        config?.openrouter?.temperature ?? defaults.openrouter.temperature,
    },
    openai: {
      model: config?.openai?.model ?? defaults.openai.model,
      baseUrl: config?.openai?.baseUrl ?? defaultBaseUrlForProvider("openai"),
      apiKey: config?.openai?.apiKey ?? defaults.openai.apiKey,
      temperature: config?.openai?.temperature ?? defaults.openai.temperature,
    },
    anthropic: {
      model: config?.anthropic?.model ?? defaults.anthropic.model,
      baseUrl:
        config?.anthropic?.baseUrl ?? defaultBaseUrlForProvider("anthropic"),
      apiKey: config?.anthropic?.apiKey ?? defaults.anthropic.apiKey,
      temperature:
        config?.anthropic?.temperature ?? defaults.anthropic.temperature,
      apiVersion:
        config?.anthropic?.apiVersion ?? defaults.anthropic.apiVersion,
      maxTokens: config?.anthropic?.maxTokens ?? defaults.anthropic.maxTokens,
    },
    gemini: {
      model: config?.gemini?.model ?? defaults.gemini.model,
      baseUrl: config?.gemini?.baseUrl ?? defaultBaseUrlForProvider("gemini"),
      apiKey: config?.gemini?.apiKey ?? defaults.gemini.apiKey,
      temperature: config?.gemini?.temperature ?? defaults.gemini.temperature,
    },
    ollama: {
      model: config?.ollama?.model ?? defaults.ollama.model,
      baseUrl: config?.ollama?.baseUrl ?? defaultBaseUrlForProvider("ollama"),
      temperature: config?.ollama?.temperature ?? defaults.ollama.temperature,
    },
  };
}

function buildOnboardingPrompts(base: OpshConfig) {
  return [
    {
      type: "confirm" as const,
      name: "warpMode",
      message:
        "Enable warp mode by default? Warp auto-runs safer commands and answers from the result.",
      initial: base.warpMode,
    },
    {
      type: (_prev: unknown, values: Record<string, unknown>) =>
        Boolean(values.warpMode ?? base.warpMode) ? null : "confirm",
      name: "confirmByDefault",
      message: "Require confirmation before execution?",
      initial: base.confirmByDefault,
    },
    {
      type: "select" as const,
      name: "providerType",
      message: "Active LLM provider",
      choices: PROVIDER_CHOICES,
      initial: providerChoiceIndex(base.provider.selected),
    },
    {
      type: "select" as const,
      name: "modelPreset",
      message: "Model preset",
      choices: (_prev: unknown, values: Record<string, unknown>) =>
        buildModelChoices(selectedProvider(values, base)),
      initial: (_prev: unknown, values: Record<string, unknown>) =>
        modelChoiceIndex(
          selectedProvider(values, base),
          getProviderDraft(base, selectedProvider(values, base)).model,
        ),
    },
    {
      type: (_prev: unknown, values: Record<string, unknown>) =>
        values.modelPreset === CUSTOM_MODEL_VALUE ? "text" : null,
      name: "customModel",
      message: "Custom model ID",
      initial: (_prev: unknown, values: Record<string, unknown>) => {
        const providerType = selectedProvider(values, base);
        return getProviderDraft(base, providerType).model;
      },
      validate: (value: string) =>
        value.trim().length > 0 ? true : "Enter a model ID.",
    },
    {
      type: (_prev: unknown, values: Record<string, unknown>) =>
        selectedProvider(values, base) === "ollama" ? null : "password",
      name: "apiKey",
      message: "API key (stored in ~/.opsh/config.json)",
      initial: (_prev: unknown, values: Record<string, unknown>) => {
        const providerType = selectedProvider(values, base);
        if (providerType === "ollama") {
          return "";
        }
        return base.provider[providerType].apiKey;
      },
    },
  ];
}

function buildConfigEditorChoices(
  config: OpshConfig,
): Array<{ title: string; description: string; value: string }> {
  const providerType = config.provider.selected;
  const choices: Array<{ title: string; description: string; value: string }> =
    [
      {
        title: "Warp mode",
        description: config.warpMode ? "On" : "Off",
        value: "warp",
      },
      {
        title: "Confirmation",
        description: config.warpMode
          ? "Managed by warp mode"
          : config.confirmByDefault
            ? "On"
            : "Off",
        value: "confirm",
      },
      {
        title: "Provider",
        description: providerLabel(providerType),
        value: "provider",
      },
      {
        title: "Model",
        description: getProviderDraft(config, providerType).model,
        value: "model",
      },
    ];

  if (providerType !== "ollama") {
    choices.push({
      title: "API key",
      description: maskSecret(getProviderApiKey(config, providerType)),
      value: "apiKey",
    });
  }

  choices.push({
    title: "Done",
    description: "Save and return",
    value: "done",
  });

  return choices;
}

function selectedProvider(
  values: Record<string, unknown>,
  base: OpshConfig,
): ProviderType {
  const value = values.providerType;
  return isProviderType(value) ? value : base.provider.selected;
}

function providerChoiceIndex(providerType: ProviderType): number {
  switch (providerType) {
    case "openrouter":
      return 0;
    case "openai":
      return 1;
    case "anthropic":
      return 2;
    case "gemini":
      return 3;
    case "ollama":
      return 4;
  }
}

function isProviderType(value: unknown): value is ProviderType {
  return (
    value === "openrouter" ||
    value === "openai" ||
    value === "anthropic" ||
    value === "gemini" ||
    value === "ollama"
  );
}

function getProviderDraft(config: OpshConfig, providerType: ProviderType) {
  switch (providerType) {
    case "openrouter":
      return config.provider.openrouter;
    case "openai":
      return config.provider.openai;
    case "anthropic":
      return config.provider.anthropic;
    case "gemini":
      return config.provider.gemini;
    case "ollama":
      return config.provider.ollama;
  }
}

function getProviderApiKey(
  config: OpshConfig,
  providerType: Exclude<ProviderType, "ollama">,
): string {
  switch (providerType) {
    case "openrouter":
      return config.provider.openrouter.apiKey;
    case "openai":
      return config.provider.openai.apiKey;
    case "anthropic":
      return config.provider.anthropic.apiKey;
    case "gemini":
      return config.provider.gemini.apiKey;
  }
}

function defaultBaseUrlForProvider(providerType: ProviderType): string {
  switch (providerType) {
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "openai":
      return "https://api.openai.com/v1";
    case "anthropic":
      return "https://api.anthropic.com/v1";
    case "gemini":
      return "https://generativelanguage.googleapis.com/v1beta";
    case "ollama":
      return "http://localhost:11434/api";
  }
}

function buildModelChoices(
  providerType: ProviderType,
): Array<{ title: string; description: string; value: string }> {
  return [
    ...MODEL_CATALOG[providerType].map((model) => ({
      title: `${model.label} ${pc.bold(model.value)}`,
      description: model.hint,
      value: model.value,
    })),
    {
      title: "Custom model ID",
      description: "Enter any provider-specific model identifier",
      value: CUSTOM_MODEL_VALUE,
    },
  ];
}

function modelChoiceIndex(providerType: ProviderType, modelId: string): number {
  const index = MODEL_CATALOG[providerType].findIndex(
    (model) => model.value === modelId,
  );
  return index >= 0 ? index : MODEL_CATALOG[providerType].length;
}

async function promptProviderSelection(
  base: OpshConfig,
): Promise<{ providerType: ProviderType; model: string; apiKey?: string }> {
  const answers = await prompts(
    [
      {
        type: "select",
        name: "providerType",
        message: "Active LLM provider",
        choices: PROVIDER_CHOICES,
        initial: providerChoiceIndex(base.provider.selected),
      },
      {
        type: "select",
        name: "modelPreset",
        message: "Model preset",
        choices: (_prev: unknown, values: Record<string, unknown>) =>
          buildModelChoices(selectedProvider(values, base)),
        initial: (_prev: unknown, values: Record<string, unknown>) =>
          modelChoiceIndex(
            selectedProvider(values, base),
            getProviderDraft(base, selectedProvider(values, base)).model,
          ),
      },
      {
        type: (_prev: unknown, values: Record<string, unknown>) =>
          values.modelPreset === CUSTOM_MODEL_VALUE ? "text" : null,
        name: "customModel",
        message: "Custom model ID",
        initial: (_prev: unknown, values: Record<string, unknown>) => {
          const providerType = selectedProvider(values, base);
          return getProviderDraft(base, providerType).model;
        },
        validate: (value: string) =>
          value.trim().length > 0 ? true : "Enter a model ID.",
      },
      {
        type: (_prev: unknown, values: Record<string, unknown>) =>
          selectedProvider(values, base) === "ollama" ? null : "password",
        name: "apiKey",
        message: "API key (stored in ~/.opsh/config.json)",
        initial: (_prev: unknown, values: Record<string, unknown>) => {
          const providerType = selectedProvider(values, base);
          return providerType === "ollama"
            ? ""
            : getProviderApiKey(base, providerType);
        },
      },
    ],
    {
      onCancel: () => {
        throw new Error("Config editing cancelled.");
      },
    },
  );

  const providerType = selectedProvider(answers, base);

  return {
    providerType,
    model: resolveAnsweredModel(
      answers,
      getProviderDraft(base, providerType).model,
    ),
    apiKey:
      providerType === "ollama"
        ? undefined
        : String(answers.apiKey ?? getProviderApiKey(base, providerType)),
  };
}

function applyProviderAnswers(
  base: OpshConfig,
  answers: {
    providerType: ProviderType;
    model?: string;
    apiKey?: string;
  },
): OpshConfig {
  const providerType = answers.providerType;
  const current = getProviderDraft(base, providerType);

  return {
    ...base,
    provider: {
      ...base.provider,
      selected: providerType,
      openrouter:
        providerType === "openrouter"
          ? {
              ...base.provider.openrouter,
              model: String(answers.model ?? current.model),
              baseUrl: defaultBaseUrlForProvider("openrouter"),
              apiKey: String(answers.apiKey ?? base.provider.openrouter.apiKey),
            }
          : base.provider.openrouter,
      openai:
        providerType === "openai"
          ? {
              ...base.provider.openai,
              model: String(answers.model ?? current.model),
              baseUrl: defaultBaseUrlForProvider("openai"),
              apiKey: String(answers.apiKey ?? base.provider.openai.apiKey),
            }
          : base.provider.openai,
      anthropic:
        providerType === "anthropic"
          ? {
              ...base.provider.anthropic,
              model: String(answers.model ?? current.model),
              baseUrl: defaultBaseUrlForProvider("anthropic"),
              apiKey: String(answers.apiKey ?? base.provider.anthropic.apiKey),
            }
          : base.provider.anthropic,
      gemini:
        providerType === "gemini"
          ? {
              ...base.provider.gemini,
              model: String(answers.model ?? current.model),
              baseUrl: defaultBaseUrlForProvider("gemini"),
              apiKey: String(answers.apiKey ?? base.provider.gemini.apiKey),
            }
          : base.provider.gemini,
      ollama:
        providerType === "ollama"
          ? {
              ...base.provider.ollama,
              model: String(answers.model ?? current.model),
              baseUrl: defaultBaseUrlForProvider("ollama"),
            }
          : base.provider.ollama,
    },
  };
}

async function promptModelSelection(
  message: string,
  providerType: ProviderType,
  currentModel: string,
): Promise<string> {
  const answers = await prompts(
    [
      {
        type: "select",
        name: "modelPreset",
        message,
        choices: buildModelChoices(providerType),
        initial: modelChoiceIndex(providerType, currentModel),
      },
      {
        type: (_prev: unknown, values: Record<string, unknown>) =>
          values.modelPreset === CUSTOM_MODEL_VALUE ? "text" : null,
        name: "customModel",
        message: "Custom model ID",
        initial: currentModel,
        validate: (value: string) =>
          value.trim().length > 0 ? true : "Enter a model ID.",
      },
    ],
    {
      onCancel: () => ({
        modelPreset: currentModel,
        customModel: currentModel,
      }),
    },
  );

  return resolveAnsweredModel(answers, currentModel);
}

function resolveAnsweredModel(
  answers: Record<string, unknown>,
  fallback: string,
): string {
  const preset =
    typeof answers.modelPreset === "string" ? answers.modelPreset : undefined;
  if (preset === CUSTOM_MODEL_VALUE) {
    const custom =
      typeof answers.customModel === "string" ? answers.customModel.trim() : "";
    return custom || fallback;
  }

  return preset ?? fallback;
}

function providerLabel(providerType: ProviderType): string {
  return (
    PROVIDER_CHOICES.find((choice) => choice.value === providerType)?.title ??
    providerType
  );
}

function maskSecret(value: string): string {
  if (!value) {
    return "Not set";
  }
  if (value.length <= 8) {
    return "Set";
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
