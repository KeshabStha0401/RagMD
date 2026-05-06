import { FileText, FileSpreadsheet, File } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FileTypeIcon({ type, className }) {
  if (type === 'pdf') return <FileText className={cn('text-red-400', className)} />;
  if (type === 'docx') return <FileText className={cn('text-blue-400', className)} />;
  if (type === 'xlsx') return <FileSpreadsheet className={cn('text-green-400', className)} />;
  return <File className={cn('text-muted-foreground', className)} />;
}