import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Bot, User, BookOpen } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 group', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 rounded bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}

      <div className={cn('max-w-[80%]', isUser && 'flex flex-col items-end')}>
        <div className={cn(
          'rounded-xl px-4 py-3',
          isUser
            ? 'bg-primary/15 border border-primary/25 text-foreground'
            : 'bg-card border border-border text-foreground'
        )}>
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="text-sm prose-sm markdown-preview max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {message.sources?.length > 0 && (
          <div className="mt-2 space-y-1.5 w-full">
            <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Sources ({message.sources.length})
            </p>
            {message.sources.map((src, i) => (
              <div key={i} className="bg-muted/50 border border-border rounded-lg px-3 py-2">
                <p className="text-[11px] font-mono text-primary mb-1">{src.section}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 italic">{src.excerpt}</p>
              </div>
            ))}
          </div>
        )}

        <span className="text-[10px] font-mono text-muted-foreground mt-1 px-1">
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}