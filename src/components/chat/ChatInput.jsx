import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatInput({ onSend, isLoading, disabled }) {
  const [value, setValue] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || isLoading || disabled) return;
    onSend(value.trim());
    setValue('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Select a document to start chatting...' : 'Ask a question about this document... (Enter to send)'}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            'w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground',
            'font-sans resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[48px] max-h-32'
          )}
          style={{ scrollbarWidth: 'thin' }}
        />
      </div>
      <button
        type="submit"
        disabled={!value.trim() || isLoading || disabled}
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0',
          'bg-primary text-primary-foreground hover:bg-primary/80',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  );
}