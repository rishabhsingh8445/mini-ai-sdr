import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mb-5 border border-accent-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)] relative">
        <div className="absolute inset-0 bg-accent-500/20 blur-xl rounded-2xl" />
        <Icon className="w-8 h-8 text-accent-400 relative z-10" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
