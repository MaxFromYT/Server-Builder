import { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-4 bg-black/40 border border-white/10">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </Card>
  );
}

export function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-4 bg-black/40 border border-white/10">
      <div className="mb-3 text-xs uppercase tracking-widest text-white/50">
        {title}
      </div>
      {children}
    </Card>
  );
}
