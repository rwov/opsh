export type SupportedShellName = "bash" | "zsh";

export type ProviderType = "openrouter" | "openai" | "anthropic" | "gemini" | "ollama";

export interface KeyedProviderConfig {
  model: string;
  baseUrl: string;
  apiKey: string;
  temperature: number;
}

export interface AnthropicProviderConfig extends KeyedProviderConfig {
  apiVersion: string;
  maxTokens: number;
}

export interface OllamaProviderConfig {
  model: string;
  baseUrl: string;
  temperature: number;
}

export interface ProvidersConfig {
  selected: ProviderType;
  openrouter: KeyedProviderConfig;
  openai: KeyedProviderConfig;
  anthropic: AnthropicProviderConfig;
  gemini: KeyedProviderConfig;
  ollama: OllamaProviderConfig;
}

export interface OpshConfig {
  version: 1;
  shell?: SupportedShellName;
  printOnly: boolean;
  warpMode: boolean;
  confirmByDefault: boolean;
  historyLimit: number;
  recentContextLimit: number;
  provider: ProvidersConfig;
}
