import { Card, CardContent } from "@/components/ui/card";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  /** Position within a grid of tiles, used to stagger the entrance animation. */
  index?: number;
}

export function StatTile({ label, value, hint, icon, index = 0 }: Readonly<StatTileProps>) {
  return (
    <Card
      className="animate-in fade-in slide-in-from-bottom-2 gap-0 py-4 duration-500 ease-out fill-mode-both hover:-translate-y-0.5"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <CardContent className="flex items-center gap-4 px-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 group-hover/card:scale-110">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold">{value}</p>
          {hint ? <div className="truncate text-xs text-muted-foreground">{hint}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
