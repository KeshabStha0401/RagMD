import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/client';
import { useParams, Link } from 'react-router-dom';
import { Download, MessageSquare, ArrowLeft, FileText, AlertCircle, Loader2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/documents/StatusBadge';
import FileTypeIcon from '@/components/documents/FileTypeIcon';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function DocumentView() {
  const { id } = useParams();
  const [tab, setTab] = useState('preview'); // preview | raw

  const { data: doc, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => client.entities.Document.filter({ id }),
    select: data => data[0],
  });

  function handleDownload() {
    if (!doc?.markdown_content) return;
    const blob = new Blob([doc.markdown_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!doc) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertCircle className="w-8 h-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Document not found.</p>
          <Link to="/documents"><Button variant="outline" size="sm">Back to Documents</Button></Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Link to="/documents" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <FileTypeIcon type={doc.file_type} className="w-5 h-5" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">{doc.title}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs font-mono text-muted-foreground">{doc.original_filename}</span>
              <StatusBadge status={doc.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {doc.status === 'ready' && (
            <>
              <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                <Download className="w-3.5 h-3.5" />
                Download .md
              </Button>
              <Link to={`/chat?doc=${doc.id}`}>
                <Button size="sm" className="gap-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask Questions
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Processing state */}
      {doc.status === 'processing' && (
        <div className="px-8 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-base font-semibold text-foreground mb-1">Extracting content...</h2>
          <p className="text-sm text-muted-foreground">This may take 30–60 seconds. Refresh to check progress.</p>
        </div>
      )}

      {doc.status === 'error' && (
        <div className="px-8 py-12">
          <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-1">Extraction Failed</h3>
                <p className="text-sm text-muted-foreground font-mono">{doc.error_message || 'Unknown error during processing.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {doc.status === 'ready' && doc.markdown_content && (
        <div className="px-8 py-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-border">
            {['preview', 'raw'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'px-4 py-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors -mb-px',
                  tab === t
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t}
              </button>
            ))}
            <div className="ml-auto text-xs font-mono text-muted-foreground">
              {doc.markdown_content.length.toLocaleString()} chars
            </div>
          </div>

          {tab === 'preview' ? (
            <div className="bg-card border border-border rounded-lg p-8 max-w-4xl">
              <div className="markdown-preview">
                <ReactMarkdown>{doc.markdown_content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-6 max-w-4xl">
              <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {doc.markdown_content}
              </pre>
            </div>
          )}

          {/* Extraction log */}
          {doc.extraction_log && (
            <div className="mt-6 max-w-4xl">
              <details className="group">
                <summary className="text-xs font-mono text-muted-foreground cursor-pointer hover:text-foreground list-none flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Extraction log
                </summary>
                <pre className="mt-2 text-xs font-mono text-muted-foreground bg-card border border-border rounded p-4 whitespace-pre-wrap">
                  {doc.extraction_log}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}