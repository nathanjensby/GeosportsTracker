import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}

export function StatTile({ label, value, hint, icon }: StatTileProps) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex items-center gap-4 px-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold">{value}</p>
          {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
