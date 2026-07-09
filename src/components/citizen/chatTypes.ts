// Shared types for the citizen chat UI.

export interface ChatMessage {
  kind: 'bot' | 'user' | 'voice' | 'typing' | 'summary' | 'ticket';
  text?: string;
  time?: string;
  // C4 — free-text the citizen typed/spoke, kept in its original script so it can
  // be re-rendered (translated/transliterated) when they switch language later.
  originalText?: string;
  originalLang?: string;
  translatable?: boolean;   // only true for free text (never for enum chip labels)
  // voice bubble: plays the actual recorded clip (no transcript shown)
  audioUrl?: string;
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
  type: 'text' | 'chips' | 'menu' | 'lang-list' | 'voicetext' | 'voice-record';
  placeholder?: string;
  mic?: boolean;
  // Pre-fills the editable text box (e.g. a voice transcript the user confirms).
  prefill?: string;
  title?: string;
  options?: PromptOption[];
  // For the voice-record prompt: the label shown on the record button and the
  // hint above it, both already localized by the flow engine.
  recordHint?: string;
  recordLabel?: string;
  stopLabel?: string;
}
