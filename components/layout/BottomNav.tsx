"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Pill, Droplets, UtensilsCrossed, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "ホーム", icon: Home },
  { href: "/medications", label: "服薬", icon: Pill, color: "text-rose-med-dark" },
  { href: "/hydration", label: "水分", icon: Droplets, color: "text-water-dark" },
  { href: "/diet", label: "食事", icon: UtensilsCrossed, color: "text-emerald-nut-dark" },
  { href: "/ai", label: "AI", icon: Sparkles, color: "text-violet-ai-dark" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-elevated/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon, color }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium transition-colors",
                active ? color || "text-foreground" : "text-muted"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
