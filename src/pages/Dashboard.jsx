import { useQuery } from '@tanstack/react-query';
import { client } from '@/api/client';
import { Link } from 'react-router-dom';
import { FileText, MessageSquare, Upload, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/documents/StatusBadge';
import FileTypeIcon from '@/components/documents/FileTypeIcon';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => client.entities.Document.list('-created_date', 50),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => client.entities.ChatConversation.list('-created_date', 5),
  });

  const ready = documents.filter(d => d.status === 'ready').length;
  const processing = documents.filter(d => d.status === 'processing').length;
  const errors = documents.filter(d => d.status === 'error').length;
  const recent = documents.slice(0, 5);

  const stats = [
    { label: 'Total Documents', value: documents.length, icon: FileText, color: 'text-primary' },
    { label: 'Ready', value: ready, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Processing', value: processing, icon: Clock, color: 'text-yellow-400' },
    { label: 'Conversations', value: conversations.length, icon: MessageSquare, color: 'text-purple-400' },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        subtitle="Document processing & RAG intelligence"
        actions={
          <Link to="/upload">
            <Button size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
          </Link>
        }
      />

      <div className="px-8 py-6 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-3xl font-bold text-foreground font-mono">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Documents */}
          <div className="bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Recent Documents</span>
              <Link to="/documents" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {recent.length === 0 && (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                  No documents yet.{' '}
                  <Link to="/upload" className="text-primary hover:underline">Upload one →</Link>
                </div>
              )}
              {recent.map(doc => (
                <Link key={doc.id} to={`/documents/${doc.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors">
                  <FileTypeIcon type={doc.file_type} className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate font-medium">{doc.title}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {doc.created_date ? formatDistanceToNow(new Date(doc.created_date), { addSuffix: true }) : ''}
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Conversations */}
          <div className="bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Recent Chats</span>
              <Link to="/chat" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {conversations.length === 0 && (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                  No conversations yet. Upload a document and start chatting.
                </div>
              )}
              {conversations.map(conv => (
                <Link key={conv.id} to={`/chat/${conv.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/50 transition-colors">
                  <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate font-medium">
                      {conv.title || 'Untitled conversation'}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {conv.document_title || 'Unknown document'} · {conv.message_count || 0} messages
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quick start */}
        {documents.length === 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">Get started with DocRAG</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              Upload a PDF, DOCX, or XLSX file. We'll extract all content with zero data loss, convert it to clean Markdown, and enable intelligent Q&A.
            </p>
            <Link to="/upload">
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload your first document
              </Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}