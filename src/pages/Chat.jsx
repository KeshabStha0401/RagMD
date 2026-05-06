import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/api/client';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import { FileText, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const messagesEndRef = useRef(null);

  const preselectedDocId = searchParams.get('doc');
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId || '');
  const [activeConvId, setActiveConvId] = useState(null);
  const [isResponding, setIsResponding] = useState(false);
  const [docPickerOpen, setDocPickerOpen] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ['documents-ready'],
    queryFn: () => client.entities.Document.filter({ status: 'ready' }, '-created_date', 50),
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => client.entities.ChatConversation.list('-created_date', 50),
  });

  const { data: activeConv, refetch: refetchConv } = useQuery({
    queryKey: ['conversation', activeConvId],
    queryFn: () => client.entities.ChatConversation.filter({ id: activeConvId }),
    select: d => d?.[0],
    enabled: !!activeConvId,
  });

  const selectedDoc = documents.find(d => d.id === selectedDocId);
  const convMessages = activeConv?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages]);

  async function startNewConversation() {
    if (!selectedDocId) return;
    const doc = documents.find(d => d.id === selectedDocId);
    const conv = await client.entities.ChatConversation.create({
      document_id: selectedDocId,
      document_title: doc?.title || '',
      title: 'New conversation',
      messages: [],
      message_count: 0,
    });
    setActiveConvId(conv.id);
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }

  async function handleSend(userText) {
    if (!selectedDocId || !activeConvId) return;

    const userMsg = {
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...convMessages, userMsg];

    // Optimistically add user message
    await client.entities.ChatConversation.update(activeConvId, {
      messages: updatedMessages,
      message_count: updatedMessages.length,
      title: activeConv?.title === 'New conversation' ? userText.slice(0, 60) : activeConv?.title,
    });
    refetchConv();

    setIsResponding(true);

    // Build RAG prompt from document markdown
    const doc = documents.find(d => d.id === selectedDocId);
    const markdownContent = doc?.markdown_content || 'No content available.';

    const conversationHistory = updatedMessages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const prompt = `You are a precise document Q&A assistant. You ONLY answer questions based on the provided document content. You NEVER hallucinate or infer beyond what is written.

STRICT RULES:
1. Answer ONLY using information explicitly stated in the document below.
2. If the answer is not in the document, say exactly: "This information is not found in the document."
3. Always cite the section/heading where you found the answer.
4. Never summarize unless explicitly asked.
5. For technical content (code, tables, specs), reproduce it exactly as it appears.
6. Respond in the same language as the question (English or Japanese/日本語).

DOCUMENT CONTENT:
---
${markdownContent.slice(0, 15000)}
---

CONVERSATION HISTORY:
${conversationHistory}

User question: ${userText}

Respond with:
1. Your answer (grounded in the document)
2. Then on a new line: SOURCES: [Section name] — [brief excerpt from that section]

Answer:`;

    const response = await client.integrations.Core.InvokeLLM({
      prompt,
    });

    // Parse response to extract sources
    let content = response;
    let sources = [];

    const sourcesMatch = response.match(/SOURCES?:\s*([\s\S]+)$/i);
    if (sourcesMatch) {
      content = response.replace(/SOURCES?:\s*([\s\S]+)$/i, '').trim();
      const rawSources = sourcesMatch[1].trim();
      sources = rawSources.split('\n').filter(Boolean).map(line => {
        const parts = line.replace(/^[-•*]\s*/, '').split(' — ');
        return {
          section: parts[0]?.trim() || 'Document',
          excerpt: parts[1]?.trim() || line.trim(),
        };
      });
    }

    const assistantMsg = {
      role: 'assistant',
      content,
      sources,
      timestamp: new Date().toISOString(),
    };

    const finalMessages = [...updatedMessages, assistantMsg];

    await client.entities.ChatConversation.update(activeConvId, {
      messages: finalMessages,
      message_count: finalMessages.length,
    });

    setIsResponding(false);
    refetchConv();
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }

  async function deleteConversation(convId) {
    await client.entities.ChatConversation.delete(convId);
    if (activeConvId === convId) setActiveConvId(null);
    qc.invalidateQueries({ queryKey: ['conversations'] });
  }

  return (
    <AppShell>
      <div className="flex h-full">
        {/* Sidebar: conversations */}
        <div className="w-52 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Chats</p>
          </div>

          {/* Doc selector */}
          <div className="px-3 py-3 border-b border-border">
            <p className="text-[10px] font-mono text-muted-foreground mb-1.5 uppercase">Document</p>
            <div className="relative">
              <button
                onClick={() => setDocPickerOpen(!docPickerOpen)}
                className="w-full flex items-center gap-1.5 bg-muted border border-border rounded px-2.5 py-1.5 text-xs text-left hover:bg-accent transition-colors"
              >
                <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-foreground">
                  {selectedDoc?.title || 'Select document'}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground ml-auto flex-shrink-0" />
              </button>
              {docPickerOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-20 max-h-48 overflow-auto">
                  {documents.length === 0 && (
                    <p className="text-xs text-muted-foreground px-3 py-4 text-center">No ready documents</p>
                  )}
                  {documents.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => { setSelectedDocId(doc.id); setDocPickerOpen(false); setActiveConvId(null); }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors',
                        selectedDocId === doc.id && 'text-primary bg-primary/10'
                      )}
                    >
                      {doc.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* New chat button */}
          <div className="px-3 py-2 border-b border-border">
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 text-xs h-7"
              onClick={startNewConversation}
              disabled={!selectedDocId}
            >
              <Plus className="w-3 h-3" />
              New Chat
            </Button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-auto">
            {conversations
              .filter(c => !selectedDocId || c.document_id === selectedDocId)
              .map(conv => (
                <div
                  key={conv.id}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors border-b border-border/50',
                    activeConvId === conv.id && 'bg-primary/10 border-l-2 border-l-primary'
                  )}
                  onClick={() => { setActiveConvId(conv.id); setSelectedDocId(conv.document_id); }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {conv.title || 'Untitled'}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {conv.message_count || 0} messages
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {activeConv?.title || (selectedDoc ? `Chat: ${selectedDoc.title}` : 'Document Q&A')}
              </h2>
              <p className="text-xs text-muted-foreground font-mono">
                {selectedDoc ? selectedDoc.title : 'Select a document to begin'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto px-6 py-6 space-y-5">
            {!activeConvId && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">RAG Q&A</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6">
                  {selectedDocId
                    ? 'Click "New Chat" to start a conversation about this document.'
                    : 'Select a document from the panel, then start a new chat.'}
                </p>
                {selectedDocId && (
                  <Button onClick={startNewConversation} size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Chat
                  </Button>
                )}
              </div>
            )}

            {convMessages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}

            {isResponding && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                </div>
                <div className="bg-card border border-border rounded-xl px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-border">
            <ChatInput
              onSend={handleSend}
              isLoading={isResponding}
              disabled={!activeConvId}
            />
            <p className="text-[10px] font-mono text-muted-foreground mt-2 text-center">
              Answers are grounded in document content only · No hallucination · Sources cited
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}