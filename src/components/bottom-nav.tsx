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
    <nav className="nav-bottom fixed bottom-0 left-0 right-0 bg-white border-t border-rosa-200 flex justify-around items-center h-16 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors",
              isActive
                ? "text-rosa-500"
                : "text-gray-400 hover:text-rosa-400"
            )}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
