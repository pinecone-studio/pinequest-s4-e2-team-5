import OpenAI from "openai";

// Бүх серверийн AI дуудлагад ашиглах нэг OpenAI client.
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Загваруудыг нэг газар төвлөрүүлж, .env-ээр дарж тохируулах боломжтой.
export const MODELS = {
  chat: process.env.OPENAI_CHAT_MODEL ?? "gpt-5",
  vision: process.env.OPENAI_VISION_MODEL ?? "gpt-5",
  transcribe: process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-transcribe",
  tts: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
  ttsVoice: process.env.OPENAI_TTS_VOICE ?? "sage",
};

// gpt-5* болон o-цуврал нь reasoning загвар — chat.completions-д өөр param авдаг.
function isReasoningModel(model: string): boolean {
  return /^(o\d|gpt-5)/.test(model);
}

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: any;
};

type ChatOptions = {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
  // gpt-5.x хувилбараас хамаарч дэмжих утга өөр (gpt-5.0: minimal; gpt-5.1+: none/xhigh).
  // "low" бол бүх gpt-5.x дээр ажилладаг найдвартай сонголт.
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
};

// Хуучин (gpt-4o) ба шинэ (gpt-5) загвар хоёуланд тохирох param-уудыг автоматаар тааруулна.
// gpt-5: max_completion_tokens, reasoning_effort, temperature ӨГӨХГҮЙ.
// gpt-4o: max_tokens, temperature.
export async function chatComplete({
  model,
  messages,
  maxTokens,
  temperature,
  jsonMode = false,
  reasoningEffort = "low",
}: ChatOptions) {
  const params: Record<string, any> = { model, messages };

  if (isReasoningModel(model)) {
    if (maxTokens) params.max_completion_tokens = maxTokens;
    if (reasoningEffort) params.reasoning_effort = reasoningEffort;
    // temperature тавихгүй — reasoning загвар зөвхөн default=1 дэмждэг.
  } else {
    if (maxTokens) params.max_tokens = maxTokens;
    if (temperature != null) params.temperature = temperature;
  }

  if (jsonMode) params.response_format = { type: "json_object" };

  return openai.chat.completions.create(params);
}
