"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { callSessionAction } from "@/services/api";
import type { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Wifi, WifiOff } from "lucide-react";

export function OnlineUsersWidget() {
  const { user: currentUser } = useUser();
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const result = await callSessionAction<User[]>("getOnlineUsers");
      if (result.success && result.data) {
        setOnlineUsers(result.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchOnlineUsers]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status?: string) => {
    if (status === "Online") return "bg-green-500";
    if (status === "Idle") return "bg-yellow-500";
    return "bg-gray-400";
  };

  const getRoleBadgeVariant = (role?: string) => {
    if (role === "Super Admin" || role === "Admin") return "default" as const;
    if (role === "Trainer") return "secondary" as const;
    if (role === "Student") return "outline" as const;
    return "outline" as const;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Online Users
        </CardTitle>
        {!loading && (
          <Badge variant="secondary" className="ml-auto">
            {onlineUsers.length} active
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <WifiOff className="h-8 w-8" />
            <p className="text-sm">No users currently online</p>
          </div>
        ) : (
          <div className="space-y-3">
            {onlineUsers.slice(0, 6).map((u) => (
              <div
                key={u["User ID"]}
                className="flex items-center gap-3 group"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(u["Full Name"])}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-1 ring-background ${getStatusColor(u.Status)}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {u["Full Name"]}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={getRoleBadgeVariant(u.Role)}
                      className="text-[10px] px-1.5 py-0 h-4"
                    >
                      {u.Role}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      <Wifi className="h-3 w-3 inline text-green-500" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {onlineUsers.length > 6 && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                +{onlineUsers.length - 6} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
