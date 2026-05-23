"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarRange,
  Target,
  UserSquare2,
  LineChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Calendar,
} from "lucide-react";
import { useUser, useClerk } from "@clerk/nextjs";

const navSections = [
  {
    label: "MAIN",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/students", label: "Students", icon: Users },
      { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
      { href: "/dashboard/trainers", label: "Trainers", icon: UserSquare2 },
      { href: "/dashboard/batches", label: "Batches", icon: GraduationCap },
      { href: "/dashboard/schedules", label: "Schedules", icon: CalendarRange },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
      { href: "/dashboard/leads", label: "Leads", icon: Target },
      { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-card",
          "md:relative md:z-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className={cn("flex h-16 items-center border-b px-4", collapsed && "justify-center")}>
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-base to-accent-heavy text-xs font-bold text-accent-fg shadow-sm">
                  S
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold leading-tight">SSP Global</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">STI TrackSuite</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-base to-accent-heavy text-xs font-bold text-accent-fg shadow-sm"
              >
                S
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ScrollArea className="flex-1 py-3">
          {navSections.map((section) => (
            <div key={section.label} className="mb-4">
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="block px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60"
                  >
                    {section.label}
                  </motion.span>
                )}
              </AnimatePresence>
              <nav className="flex flex-col gap-0.5 px-2">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <TooltipProvider key={item.href} delayDuration={collapsed ? 100 : 1000}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={item.href} onClick={onClose}>
                            <div
                              className={cn(
                                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                                collapsed && "justify-center px-2",
                                active
                                  ? "bg-accent-soft text-accent-base"
                                  : "text-muted-foreground hover:bg-accent-soft/40 hover:text-foreground"
                              )}
                            >
                              {active && (
                                <motion.div
                                  layoutId="active-indicator"
                                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent-base"
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                              <item.icon className="h-4 w-4 shrink-0" />
                              <AnimatePresence mode="wait">
                                {!collapsed && (
                                  <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden whitespace-nowrap"
                                  >
                                    {item.label}
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                          </Link>
                        </TooltipTrigger>
                        {collapsed && (
                          <TooltipContent side="right" sideOffset={10}>
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </nav>
            </div>
          ))}
        </ScrollArea>

        <div className="border-t p-2">
          <AnimatePresence>
            {!collapsed && user && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2 rounded-lg bg-accent/30 px-3 py-2"
              >
                <p className="truncate text-xs font-medium">{user.fullName || "User"}</p>
                <p className="truncate text-[10px] text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className={cn("h-8 justify-start text-muted-foreground hover:text-foreground", collapsed ? "w-full px-0 justify-center" : "flex-1")}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-2 overflow-hidden whitespace-nowrap text-xs"
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden h-8 w-8 shrink-0 md:flex"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
