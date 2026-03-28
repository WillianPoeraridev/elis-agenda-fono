"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Hoje", icon: Home },
  { href: "/upload", label: "Upload", icon: Camera },
  { href: "/historico", label: "Histórico", icon: Calendar },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <nav className="nav-bottom mx-auto md:max-w-4xl bg-white/80 backdrop-blur-xl border-t border-rosa-100 md:rounded-t-2xl md:shadow-lg flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-rosa-500 bg-rosa-100/70"
                  : "text-gray-400 hover:text-rosa-400 active:scale-95"
              )}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
