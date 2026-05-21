"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "@/constants";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Target,
  GraduationCap,
  BarChart3,
  Settings,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Target,
  GraduationCap,
  BarChart3,
  Settings,
  Layers,
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load initial collapsed state on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full border-r border-border/40 bg-background/95 backdrop-blur-xl transition-all duration-300 md:static md:translate-x-0",
          isCollapsed ? "w-72 md:w-16" : "w-72",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className={cn(
          "flex h-16 items-center justify-between border-b border-border/40 px-4 transition-all duration-300",
          isCollapsed ? "md:px-3" : "px-6 md:px-5"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-[10px] font-black text-white uppercase flex-shrink-0">
              STI
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-200">
                <span className="text-sm font-bold tracking-tight text-foreground leading-none">STI Tracksuite</span>
                <span className="text-[9px] font-semibold text-muted-foreground tracking-wider uppercase leading-none mt-1">SSP Global</span>
              </div>
            )}
          </Link>
          
          <button
            onClick={toggleCollapse}
            className="hidden md:flex h-5 w-5 items-center justify-center rounded border border-border/80 bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-all shadow-sm flex-shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            
            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isCollapsed ? "md:justify-center md:px-2" : "gap-3",
                  isActive
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className={cn("transition-all duration-200", isCollapsed ? "md:hidden" : "")}>{item.label}</span>
                {isActive && (
                  <div className={cn("ml-auto h-1.5 w-1.5 rounded-full bg-blue-500", isCollapsed ? "md:hidden" : "")} />
                )}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={10} className="hidden md:block">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>
      </aside>
    </>
  );
}
