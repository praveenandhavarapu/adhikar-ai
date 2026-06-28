// Shared types for the citizen chat UI.

export interface ChatMessage {
  kind: 'bot' | 'user' | 'voice' | 'typing' | 'summary' | 'ticket';
  text?: string;
  time?: string;
  // summary card
  rows?: Array<[string, string]>;
  // ticket card
  tid?: string;
  tpriority?: boolean;
  headBg?: string;
  headLabel?: string;
}

export interface PromptOption {
  value: string;
  label: string;
  sub?: string;
  mono?: string;
  tint?: string;
  fg?: string;
}

export interface Prompt {
  type: 'text' | 'chips' | 'menu' | 'lang-list' | 'voicetext';
  placeholder?: string;
  mic?: boolean;
  title?: string;
  options?: PromptOption[];
}
