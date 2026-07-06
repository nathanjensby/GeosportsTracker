import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeDailyPlayerStats } from "@/lib/stats";
import type { DailyResult } from "@/types";
import { Skull, Star } from "lucide-react";

interface PlayerHeatmapCalendarProps {
  playerId: string;
  dailyResults: DailyResult[];
}

interface DayCell {
  date: string;
  score: number | null;
  winner: boolean;
  stupid: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Every calendar date is treated as UTC midnight, matching how "YYYY-MM-DD"
// strings are parsed elsewhere in the app (see daysBetween in lib/stats.ts).
// This keeps day-by-day iteration immune to the local timezone's DST shifts.
function parseISODate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

function formatISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getTime() + amount * MS_PER_DAY);
}

function formatDisplayDate(dateStr: string): string {
  return parseISODate(dateStr).toLocaleDateString(undefined, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SCORE_TIERS: { min: number; label: string; bg: string; star: string }[] = [
  { min: 900, label: "900+", bg: "bg-emerald-700 dark:bg-emerald-400", star: "text-white dark:text-emerald-950" },
  { min: 800, label: "800–899", bg: "bg-emerald-600 dark:bg-emerald-500", star: "text-white" },
  { min: 700, label: "700–799", bg: "bg-emerald-500 dark:bg-emerald-600", star: "text-white" },
  { min: 600, label: "600–699", bg: "bg-emerald-300 dark:bg-emerald-800", star: "text-emerald-950 dark:text-white" },
  { min: -Infinity, label: "<600", bg: "bg-emerald-100 dark:bg-emerald-950", star: "text-emerald-900 dark:text-emerald-100" },
];

function getScoreTier(score: number) {
  return SCORE_TIERS.find((tier) => score >= tier.min) ?? SCORE_TIERS[SCORE_TIERS.length - 1];
}

export function PlayerHeatmapCalendar({ playerId, dailyResults }: PlayerHeatmapCalendarProps) {
  if (dailyResults.length === 0) return null;

  const sortedDays = [...dailyResults].sort((a, b) => a.date.localeCompare(b.date));
  const resultsByDate = new Map(sortedDays.map((day) => [day.date, day]));

  const firstDate = parseISODate(sortedDays[0].date);
  const lastDate = parseISODate(sortedDays[sortedDays.length - 1].date);

  // Pad out to full weeks (Sunday-start), matching GitHub's contribution calendar.
  const startDate = addDays(firstDate, -firstDate.getUTCDay());
  const endDate = addDays(lastDate, 6 - lastDate.getUTCDay());

  const days: DayCell[] = [];
  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    const dateStr = formatISODate(cursor);
    const day = resultsByDate.get(dateStr);
    const entry = day ? computeDailyPlayerStats(day).find((s) => s.playerId === playerId) : undefined;

    days.push({
      date: dateStr,
      score: entry?.score ?? null,
      winner: entry?.winner ?? false,
      stupid: entry?.stupid ?? false,
    });
  }

  const weeks: DayCell[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  let lastLabeledMonth = -1;
  const monthLabels = weeks.map((week) => {
    const month = parseISODate(week[0].date).getUTCMonth();
    if (month === lastLabeledMonth) return null;
    lastLabeledMonth = month;
    return parseISODate(week[0].date).toLocaleDateString(undefined, { timeZone: "UTC", month: "short" });
  });

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
      <CardHeader>
        <CardTitle>Score History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1.5">
            <div className="flex shrink-0 flex-col gap-1.5 pt-5.5 text-[10px] text-muted-foreground">
              {DAY_LABELS.map((label, index) => (
                <span key={label} className="flex h-4 items-center sm:h-5">
                  {index % 2 === 1 ? label.slice(0, 1) : ""}
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              {weeks.map((week, weekIndex) => (
                <div key={week[0].date} className="flex flex-col gap-1.5">
                  <span className="block h-4.5 text-[10px] leading-4.5 whitespace-nowrap text-muted-foreground">
                    {monthLabels[weekIndex] ?? ""}
                  </span>
                  {week.map((cell) => {
                    const tier = cell.score === null ? null : getScoreTier(cell.score);
                    return (
                      <div
                        key={cell.date}
                        title={
                          cell.score === null
                            ? formatDisplayDate(cell.date)
                            : `${formatDisplayDate(cell.date)}: ${cell.score}${cell.winner ? " · Highest" : ""}${cell.stupid ? " · Lowest" : ""}`
                        }
                        className={`relative size-4 rounded-xs sm:size-5 ${tier ? tier.bg : "bg-muted"}`}
                      >
                        {cell.winner ? (
                          <Star className={`absolute inset-0 m-auto size-2.5 sm:size-3 ${tier?.star ?? "text-white"}`} />
                        ) : null}
                        {cell.stupid ? (
                          <Skull className={`absolute inset-0 m-auto size-2.5 sm:size-3 ${tier?.star ?? "text-white"}`} />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {SCORE_TIERS.map((tier) => (
            <div key={tier.label} className="flex items-center gap-1.5">
              <span className={`size-3 rounded-xs ${tier.bg}`} />
              {tier.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <Star className="size-3 text-foreground" />
            Highest that day
          </div>
          <div className="flex items-center gap-1.5">
            <Skull className="size-3 text-foreground" />
            Lowest that day
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
