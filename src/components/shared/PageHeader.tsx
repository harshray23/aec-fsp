import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 border-b pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-8 w-8 text-primary" />}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  );
}
