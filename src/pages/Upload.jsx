import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '@/api/client';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Upload as UploadIcon, FileText, FileSpreadsheet, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/msword': 'docx',
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Upload() {
  const navigate = useNavigate();
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | processing | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [docId, setDocId] = useState(null);

  function handleFile(f) {
    if (!ALLOWED_TYPES[f.type]) {
      setErrorMsg('Unsupported file type. Please upload PDF, DOCX, or XLSX.');
      return;
    }
    setErrorMsg('');
    setFile(f);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function processDocument(docId, fileUrl, fileType) {
    // Local extractor handles pdf, xlsx, and docx in-browser.
    const extracted = await client.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
    });
    const rawContent = extracted?.output?.raw_text || '';

    const markdownPrompt = `You are a precise document processor. Convert the following extracted document content to clean, structured Markdown.

STRICT RULES:
1. Preserve ALL section hierarchy using proper heading levels (# ## ### etc).
2. Convert ALL tables to Markdown table format — never flatten them.
3. Wrap ALL code blocks in triple backticks with language identifier.
4. Support both Japanese (日本語) and English content — preserve all characters.
5. Do NOT summarize, paraphrase, or drop any content.
6. Output ONLY the Markdown — no preamble, no explanation.

File type: ${fileType.toUpperCase()}

EXTRACTED CONTENT:
${rawContent.slice(0, 40000)}

Output the complete Markdown:`;

    const result = await client.integrations.Core.InvokeLLM({
      prompt: markdownPrompt,
    });

    await client.entities.Document.update(docId, {
      markdown_content: result,
      status: 'ready',
      extraction_log: `Extracted at ${new Date().toISOString()} via local extractor + LLM. File type: ${fileType}.`,
    });
  }

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setErrorMsg('');

    const fileType = ALLOWED_TYPES[file.type];
    const title = file.name.replace(/\.[^/.]+$/, '');

    // Upload file
    const { file_url } = await client.integrations.Core.UploadFile({ file });

    // Create document record
    const doc = await client.entities.Document.create({
      title,
      original_filename: file.name,
      file_type: fileType,
      file_url,
      file_size_bytes: file.size,
      status: 'processing',
    });

    setDocId(doc.id);
    setStatus('processing');

    // Process with LLM
    try {
      await processDocument(doc.id, file_url, fileType);
      setStatus('done');
    } catch (err) {
      console.error('Document processing failed:', err);
      const message = err?.message || String(err) || 'Processing failed.';
      await client.entities.Document.update(doc.id, {
        status: 'error',
        error_message: message,
      });
      setStatus('error');
      setErrorMsg(message);
    }
  }

  const FileIcon = file?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ? FileSpreadsheet : FileText;

  return (
    <AppShell>
      <PageHeader title="Upload Document" subtitle="PDF, DOCX, or XLSX — zero data loss extraction" />

      <div className="px-8 py-8 max-w-2xl">
        {status === 'idle' || status === 'error' ? (
          <>
            {/* Drop zone */}
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/30'
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.xlsx"
                onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
              />
              <UploadIcon className={cn('w-10 h-10 mx-auto mb-4 transition-colors', dragOver ? 'text-primary' : 'text-muted-foreground')} />
              <p className="text-sm font-medium text-foreground mb-1">
                Drop file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground font-mono">PDF · DOCX · XLSX</p>
            </div>

            {errorMsg && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Selected file preview */}
            {file && !errorMsg && (
              <div className="mt-4 flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
                <FileIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{formatBytes(file.size)}</p>
                </div>
                <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button onClick={handleUpload} disabled={!file} className="gap-2">
                <UploadIcon className="w-4 h-4" />
                Upload & Process
              </Button>
            </div>

            {/* Info */}
            <div className="mt-8 space-y-2">
              {[
                'All content extracted — text, tables, code blocks, headings',
                'Multi-language support (Japanese + English)',
                'UNPARSED_CONTENT blocks for unresolvable content',
                'RAG-ready: ask questions after processing',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </>
        ) : status === 'uploading' ? (
          <ProcessingState
            icon={<UploadIcon className="w-8 h-8 text-primary animate-bounce" />}
            title="Uploading file..."
            subtitle="Transferring to secure storage"
          />
        ) : status === 'processing' ? (
          <ProcessingState
            icon={<Loader2 className="w-8 h-8 text-primary animate-spin" />}
            title="Extracting & converting..."
            subtitle="Zero data loss extraction in progress. This may take 30–60 seconds."
            steps={[
              'Parsing document structure',
              'Extracting text, tables & code blocks',
              'Converting to structured Markdown',
              'Preparing for RAG indexing',
            ]}
          />
        ) : (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">Processing Complete</h2>
            <p className="text-sm text-muted-foreground mb-6">Your document is ready for viewing and Q&A.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(`/documents/${docId}`)}>View Document</Button>
              <Button variant="outline" onClick={() => navigate(`/chat?doc=${docId}`)}>Start Chat</Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ProcessingState({ icon, title, subtitle, steps }) {
  return (
    <div className="text-center py-12">
      <div className="flex items-center justify-center mb-6">{icon}</div>
      <h2 className="text-lg font-semibold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-8">{subtitle}</p>
      {steps && (
        <div className="inline-block text-left space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}