export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-border">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}