"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "GeoSports" },
  { href: "/maptap", label: "MapTap" },
  { href: "/maptap/challenge", label: "Challenge", nested: true },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  nested,
  active,
  className,
}: Readonly<{ href: string; label: string; nested?: boolean; active: boolean; className?: string }>) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 transition-colors hover:text-foreground",
        nested && "pl-3 text-muted-foreground/80 before:mr-1.5 before:content-['↳']",
        active && "text-foreground",
        className,
      )}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Globe2 className="size-4.5" />
          </span>
          <span className="text-base sm:text-lg">
            GeoStats <span className="text-primary">Tracker</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} active={isActive(pathname, link.href)} />
          ))}
        </nav>
      </div>

      <nav className="flex items-center gap-4 overflow-x-auto px-4 pb-3 text-sm font-medium text-muted-foreground sm:hidden">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} active={isActive(pathname, link.href)} />
        ))}
      </nav>
    </header>
  );
}
