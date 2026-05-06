# RAGMD

Local-first document Q&A. Upload **PDF / DOCX / XLSX**, extract to Markdown, and
chat with the content using your own LLM API key. All data lives in the browser
(IndexedDB) — there is no hosted backend.

---

## Prerequisites

- **Node.js 18+** (Node 20 LTS recommended) — check with `node -v`
- **npm 9+** — check with `npm -v`
- A modern Chromium-based browser (Chrome, Edge, Brave, Arc) or Firefox
- One of the following:
  - A **Google Gemini** API key (free tier available at <https://aistudio.google.com/apikey>), or
  - An **Anthropic** API key (<https://console.anthropic.com/>), or
  - An **OpenAI** API key (<https://platform.openai.com/api-keys>), or
  - An **OpenRouter** API key (<https://openrouter.ai/keys>) — one key, hundreds of models, or
  - **Ollama** installed locally (<https://ollama.com/download>) for fully offline use

---

## 1. Get the code

```bash
git clone <this-repo-url> ragmd
cd ragmd
```

## 2. Install dependencies

```bash
npm install
```

If you hit npm cache permission errors on macOS, use a per-run cache:

```bash
npm install --cache /tmp/ragmd-npm-cache
```

## 3. Configure your LLM provider

Copy the example env file and edit it:

```bash
cp .env.example .env.local
```

Open `.env.local` and set `VITE_LLM_PROVIDER` plus the matching key. Pick **one**
of the five sections below.

### Option A — Google Gemini (easiest, free tier)

```env
VITE_LLM_PROVIDER=gemini
VITE_GEMINI_API_KEY=AIza...your-key...
# VITE_GEMINI_MODEL=gemini-2.0-flash   # optional; default shown
```

### Option B — Anthropic Claude

```env
VITE_LLM_PROVIDER=anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-...your-key...
# VITE_ANTHROPIC_MODEL=claude-sonnet-4-5-20250929   # optional
```

> The browser sends `anthropic-dangerous-direct-browser-access: true`. Only use
> a personal key — never ship a build with this header to untrusted users.

### Option C — OpenAI

```env
VITE_LLM_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-...your-key...
# VITE_OPENAI_MODEL=gpt-4o-mini   # optional
```

### Option D — OpenRouter (one key, many models)

[OpenRouter](https://openrouter.ai/) gives you a single API key that routes to
hundreds of models (OpenAI, Anthropic, Google, Meta, Mistral, free community
models, etc.) with pay-as-you-go billing and no per-provider quotas to manage.

1. Create an account and key at <https://openrouter.ai/keys>.
2. (Optional) Add a few dollars of credit at <https://openrouter.ai/credits>;
   some models (e.g. those with `:free` suffix) work without credit.
3. Browse models at <https://openrouter.ai/models> and copy the model slug.
4. Set `.env.local`:

```env
VITE_LLM_PROVIDER=openrouter
VITE_OPENROUTER_API_KEY=sk-or-v1-...your-key...
# Pick any model slug from https://openrouter.ai/models
VITE_OPENROUTER_MODEL=openrouter/auto
# Optional: app attribution shown on your OpenRouter dashboard
# VITE_OPENROUTER_REFERER=http://localhost:5173
# VITE_OPENROUTER_TITLE=RAGMD
```

Common model slugs to try:

| Slug | Notes |
|---|---|
| `openrouter/auto` | OpenRouter picks a sensible default per request |
| `google/gemini-2.5-flash` | Fast, cheap, good for Markdown conversion |
| `anthropic/claude-sonnet-4.5` | High quality, higher cost |
| `openai/gpt-4o-mini` | Fast and cheap |
| `meta-llama/llama-3.3-70b-instruct:free` | Free tier, rate-limited |
| `deepseek/deepseek-chat-v3.1:free` | Free tier, rate-limited |

Calls go directly from the browser to `https://openrouter.ai/api/v1/...`.

### Option E — Ollama (fully offline)

1. Install Ollama: <https://ollama.com/download>
2. Pull a model: `ollama pull llama3.2`
3. Make sure Ollama is running: `ollama serve` (it usually auto-starts)
4. Set `.env.local`:

```env
VITE_LLM_PROVIDER=ollama
# VITE_OLLAMA_BASE_URL=http://localhost:11434   # optional; default shown
# VITE_OLLAMA_MODEL=llama3.2                    # optional; default shown
```

You may need to allow CORS from the Vite dev origin. Set this before launching
Ollama:

```bash
OLLAMA_ORIGINS="http://localhost:5173" ollama serve
```

## 4. Start the dev server

```bash
npm run dev
```

Open the printed URL (default <http://localhost:5173>). The app should load
straight to the dashboard — no login.

## 5. Try the full flow

1. Click **Upload Document** → drop in a PDF, DOCX, or XLSX (≲ 10 MB recommended).
2. Wait for status to flip from **processing** → **ready** (extraction + LLM
   conversion runs in the background).
3. Open the document to view the extracted Markdown, or click **Ask Questions**
   to start a chat grounded in that document.

---

## Where your data lives

Everything is stored in the browser's **IndexedDB** under database `ragmd`:

- `Document` table — document metadata + extracted Markdown
- `ChatConversation` table — messages and sources
- `Files` table — original uploaded file blobs

Inspect or wipe via DevTools → Application → IndexedDB → `ragmd`. Clearing
browser site data deletes everything.

---

## Production build

```bash
npm run build      # outputs to dist/
npm run preview    # serves dist/ on http://localhost:4173
```

The build is a static SPA — host `dist/` on any static file server (Netlify,
Vercel static, GitHub Pages, `nginx`, `python -m http.server`, etc.).

---

## Troubleshooting

- **`VITE_..._API_KEY is not set`** — env vars must start with `VITE_` and live
  in `.env.local`. Restart `npm run dev` after editing.
- **Anthropic 401 / CORS** — confirm the key is valid and that you copied it
  including the `sk-ant-` prefix.
- **Ollama: `Failed to fetch`** — Ollama isn't running, or CORS blocked it.
  Start it with `OLLAMA_ORIGINS="http://localhost:5173" ollama serve`.
- **PDF extraction is empty** — scanned/image-only PDFs have no text layer; OCR
  is not included. Try a text-based PDF.
- **Stuck on "processing"** — open DevTools → Console; LLM/network errors are
  surfaced there. Document status will flip to `error` with a message.
- **Want to start fresh** — DevTools → Application → IndexedDB → right-click
  `ragmd` → **Delete database**.

---

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run typecheck` | `tsc` against `jsconfig.json` |
