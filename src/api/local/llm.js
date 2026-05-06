// LLM adapter. Provider chosen via VITE_LLM_PROVIDER.
// Supported: gemini | anthropic | openai | openrouter | ollama.
// Each provider takes a prompt string and returns a string response.

const env = import.meta.env;
const PROVIDER = (env.VITE_LLM_PROVIDER || 'gemini').toLowerCase();

async function callGemini(prompt) {
  const apiKey = env.VITE_GEMINI_API_KEY;
  const model = env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
}

async function callAnthropic(prompt) {
  const apiKey = env.VITE_ANTHROPIC_API_KEY;
  const model = env.VITE_ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.content?.map(b => b.text).filter(Boolean).join('') || '';
}

async function callOpenAI(prompt) {
  const apiKey = env.VITE_OPENAI_API_KEY;
  const model = env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callOpenRouter(prompt) {
  const apiKey = env.VITE_OPENROUTER_API_KEY;
  const model = env.VITE_OPENROUTER_MODEL || 'openrouter/auto';
  if (!apiKey) throw new Error('VITE_OPENROUTER_API_KEY is not set');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (env.VITE_OPENROUTER_REFERER) headers['HTTP-Referer'] = env.VITE_OPENROUTER_REFERER;
  if (env.VITE_OPENROUTER_TITLE) headers['X-Title'] = env.VITE_OPENROUTER_TITLE;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function callOllama(prompt) {
  const baseUrl = env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = env.VITE_OLLAMA_MODEL || 'llama3.2';

  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.response || '';
}

export async function invokeLLM(prompt) {
  switch (PROVIDER) {
    case 'gemini': return callGemini(prompt);
    case 'anthropic': return callAnthropic(prompt);
    case 'openai': return callOpenAI(prompt);
    case 'openrouter': return callOpenRouter(prompt);
    case 'ollama': return callOllama(prompt);
    default: throw new Error(`Unknown VITE_LLM_PROVIDER: ${PROVIDER}`);
  }
}
