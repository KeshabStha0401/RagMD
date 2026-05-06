import { Link, useLocation } from 'react-router-dom';
import { FileText, MessageSquare, Upload, LayoutDashboard, Settings, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Documents', icon: FileText, to: '/documents' },
  { label: 'Upload', icon: Upload, to: '/upload' },
  { label: 'Chat', icon: MessageSquare, to: '/chat' },
];

export default function AppShell({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
          <div className="w-7 h-7 rounded bg-primary/20 border border-primary/40 flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-foreground">DocRAG</span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">v1</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(({ label, icon: Icon, to }) => {
            const active = pathname === to || (to !== '/' && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all',
                  active
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-border">
          <Link
            to="/settings"
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all',
              pathname === '/settings'
                ? 'bg-primary/15 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}