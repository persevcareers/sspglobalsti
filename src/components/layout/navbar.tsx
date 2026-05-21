"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useUser, UserButton, Show } from "@clerk/nextjs";
import { Menu, Moon, Sun, Bell, User, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/useNotifications";

interface NavbarProps {
  onMenuClick: () => void;
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isLoaded, user } = useUser();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllAsRead}>
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif["Notification ID"]}
                  className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer ${notif["Is Read"] !== "TRUE" ? "bg-muted/50" : ""}`}
                  onClick={() => {
                    if (notif["Is Read"] !== "TRUE") {
                      markAsRead(notif["Notification ID"]);
                    }
                    if (notif.Link) {
                      window.location.href = notif.Link;
                    }
                  }}
                >
                  <div className="mt-0.5">
                    <NotificationIcon type={notif.Type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${notif["Is Read"] !== "TRUE" ? "font-semibold" : "font-normal"}`}>
                      {notif.Title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{notif.Message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {timeAgo(notif["Created At"])}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            {mounted && theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        {!isLoaded ? (
          <>
            <Skeleton className="h-4 w-24 hidden md:block" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </>
        ) : (
          <>
            <Show when="signed-in">
              <span className="hidden text-sm font-medium md:block">
                {user?.fullName || user?.username || "User"}
              </span>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </Show>
            <Show when="signed-out">
              <Button variant="outline" size="icon" className="rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </Show>
          </>
        )}
      </div>
    </header>
  );
}
