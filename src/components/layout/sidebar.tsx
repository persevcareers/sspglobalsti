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
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/students", label: "Students", icon: Users },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/batches", label: "Batches", icon: GraduationCap },
  { href: "/dashboard/trainers", label: "Trainers", icon: UserSquare2 },
  { href: "/dashboard/schedules", label: "Schedules", icon: CalendarRange },
  { href: "/dashboard/leads", label: "Leads", icon: Target },
  { href: "/dashboard/analytics", label: "Analytics", icon: LineChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const sidebarVariants = {
  expanded: { width: 288 },
  collapsed: { width: 64 },
};

const navItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.04 },
  }),
};

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={collapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-card backdrop-blur-xl",
          "md:relative md:z-0",
          collapsed ? "w-16" : "w-72",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className={cn("flex h-16 items-center border-b px-4", collapsed && "justify-center px-2")}>
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.span
                key="logo-text"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold tracking-tight whitespace-nowrap"
              >
                STI TrackSuite
              </motion.span>
            ) : (
              <motion.span
                key="logo-icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-bold"
              >
                S
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <ScrollArea className="flex-1 py-2">
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item, i) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  custom={i}
                  variants={navItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <TooltipProvider delayDuration={collapsed ? 100 : 1000}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={item.href} onClick={onClose}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start gap-3 transition-all duration-200",
                              collapsed ? "px-3" : "px-3",
                              isActive
                                ? "bg-accent text-accent-foreground font-medium"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                            )}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <AnimatePresence mode="wait">
                              {!collapsed && (
                                <motion.span
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: "auto" }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden whitespace-nowrap"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right" sideOffset={10}>
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              );
            })}
          </nav>
        </ScrollArea>

        <div className={cn("border-t p-2", collapsed && "flex justify-center")}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-8 w-full justify-center"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
