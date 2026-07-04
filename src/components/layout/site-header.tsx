import Link from "next/link";
import { Globe2 } from "lucide-react";

const NAV_LINKS = [
  { href: "#leaderboard", label: "Leaderboard" },
  { href: "#today", label: "Today" },
  { href: "#trends", label: "Trends" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Globe2 className="size-4.5" />
          </span>
          <span className="text-base sm:text-lg">
            GeoSports <span className="text-primary">Tracker</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      <nav className="flex items-center gap-4 overflow-x-auto px-4 pb-3 text-sm font-medium text-muted-foreground sm:hidden">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} className="shrink-0 transition-colors hover:text-foreground">
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
