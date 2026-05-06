import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/layout/PageHeader';
import { Shield, Database, Cpu, Globe } from 'lucide-react';

const SETTINGS_INFO = [
  {
    icon: Cpu,
    title: 'AI Model',
    description: 'Document extraction and Q&A use Claude Sonnet (via Base44 integrations) — chosen for superior multilingual support (Japanese + English) and long-context document processing.',
    value: 'Claude Sonnet 4.6',
  },
  {
    icon: Database,
    title: 'Storage',
    description: 'Original files are uploaded to Base44 file storage. Extracted Markdown is persisted in the Document entity. All data is scoped to your user account.',
    value: 'Base44 Storage',
  },
  {
    icon: Shield,
    title: 'Privacy',
    description: 'Documents are stored per-user and are never shared across accounts. The RAG system queries only your stored Markdown content — no external data access.',
    value: 'Per-user isolated',
  },
  {
    icon: Globe,
    title: 'Languages',
    description: 'Full support for Japanese (日本語) and English content in the same document. Multi-language content is preserved exactly as extracted.',
    value: 'JA + EN',
  },
];

export default function Settings() {
  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="System configuration and information" />
      <div className="px-8 py-8 max-w-2xl space-y-4">
        {SETTINGS_INFO.map(({ icon: Icon, title, description, value }) => (
          <div key={title} className="bg-card border border-border rounded-lg p-5 flex gap-4">
            <div className="w-9 h-9 rounded bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {value}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
        ))}

        <div className="bg-muted/40 border border-border rounded-lg p-5 mt-6">
          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Zero Data Loss Policy</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If any content cannot be parsed during extraction, it is represented as an <code className="text-primary bg-muted px-1 rounded font-mono text-[11px]">[UNPARSED_CONTENT]</code> block with type, location, and raw data — so nothing is silently dropped.
          </p>
        </div>
      </div>
    </AppShell>
  );
}