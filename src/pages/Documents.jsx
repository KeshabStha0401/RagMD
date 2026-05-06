import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/api/client';
import { Link } from 'react-router-dom';
import { Upload, Search, Trash2, MessageSquare, Eye } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/layout/PageHeader';
import StatusBadge from '@/components/documents/StatusBadge';
import FileTypeIcon from '@/components/documents/FileTypeIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => client.entities.Document.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => client.entities.Document.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });

  const filtered = documents.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.original_filename?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <PageHeader
        title="Documents"
        subtitle={`${documents.length} document${documents.length !== 1 ? 's' : ''} in your library`}
        actions={
          <Link to="/upload">
            <Button size="sm" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </Link>
        }
      />

      <div className="px-8 py-6">
        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border font-mono text-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left text-xs font-mono text-muted-foreground px-5 py-3 uppercase tracking-wider">Document</th>
                <th className="text-left text-xs font-mono text-muted-foreground px-4 py-3 uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left text-xs font-mono text-muted-foreground px-4 py-3 uppercase tracking-wider hidden lg:table-cell">Size</th>
                <th className="text-left text-xs font-mono text-muted-foreground px-4 py-3 uppercase tracking-wider">Status</th>
                <th className="text-left text-xs font-mono text-muted-foreground px-4 py-3 uppercase tracking-wider hidden md:table-cell">Uploaded</th>
                <th className="px-4 py-3 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      {search ? 'No documents match your search.' : 'No documents uploaded yet.'}
                    </p>
                    {!search && (
                      <Link to="/upload">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          Upload your first document
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              )}
              {filtered.map(doc => (
                <tr key={doc.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <FileTypeIcon type={doc.file_type} className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-foreground">{doc.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">{doc.original_filename}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="text-xs font-mono text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded">
                      {doc.file_type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-xs font-mono text-muted-foreground">
                    {formatBytes(doc.file_size_bytes)}
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-xs font-mono text-muted-foreground">
                    {doc.created_date ? formatDistanceToNow(new Date(doc.created_date), { addSuffix: true }) : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      <Link to={`/documents/${doc.id}`}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      {doc.status === 'ready' && (
                        <Link to={`/chat?doc=${doc.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                        onClick={() => deleteMutation.mutate(doc.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}