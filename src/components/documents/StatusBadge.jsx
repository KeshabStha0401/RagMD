import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

const CONFIG = {
  uploading: { label: 'Uploading', icon: Upload, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', spin: true },
  ready: { label: 'Ready', icon: CheckCircle2, color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  error: { label: 'Error', icon: AlertCircle, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.processing;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-mono font-medium', cfg.color)}>
      <Icon className={cn('w-3 h-3', cfg.spin && 'animate-spin')} />
      {cfg.label}
    </span>
  );
}