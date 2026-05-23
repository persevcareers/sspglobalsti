"use client";

import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/common/page-header";
import { useAccentTheme, type AccentColorName } from "@/components/common/AccentThemeContext";
import { fadeIn } from "@/lib/animations";
import { User, Monitor, Bell, ShieldCheck, Building2, Database, Loader2, Check, Sun, Moon, Palette, Grip, EyeOff, LayoutPanelLeft, Activity, Users, ChartBar, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { fetchRoles, type RolePermission } from "@/services/roles";

const accentColors: { name: AccentColorName; label: string; className: string }[] = [
  { name: "indigo", label: "Indigo", className: "bg-indigo-500" },
  { name: "emerald", label: "Emerald", className: "bg-emerald-500" },
  { name: "amber", label: "Amber", className: "bg-amber-500" },
  { name: "rose", label: "Rose", className: "bg-rose-500" },
  { name: "violet", label: "Violet", className: "bg-violet-500" },
  { name: "cyan", label: "Cyan", className: "bg-cyan-500" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isLoaded, user } = useUser();
  const { accentColor, setAccentColor, compactMode, setCompactMode } = useAccentTheme();
  const [testingConnection, setTestingConnection] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) {
        throw new Error("Google Script URL is not configured");
      }
      const response = await fetch(`${scriptUrl}?action=ping`, { method: "GET" });
      if (response.ok) {
        toast.success("Successfully connected to Google Sheets backend!");
      } else {
        toast.error("Connected to server, but returned an error response.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to reach Google Sheets API.");
    } finally {
      setTestingConnection(false);
    }
  };

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch {
      toast.error("Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  };

  const clearCache = () => {
    sessionStorage.clear();
    toast.success("Session cache cleared");
  };

  if (!isLoaded) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="max-w-4xl space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and system configuration."
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 max-w-3xl">
          <TabsTrigger value="profile" className="flex items-center gap-2"><User className="h-4 w-4" /><span className="hidden sm:inline">Profile</span></TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2"><Palette className="h-4 w-4" /><span className="hidden sm:inline">Appearance</span></TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell className="h-4 w-4" /><span className="hidden sm:inline">Notifications</span></TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /><span className="hidden sm:inline">Security</span></TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2"><Building2 className="h-4 w-4" /><span className="hidden sm:inline">Organization</span></TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2"><Database className="h-4 w-4" /><span className="hidden sm:inline">System</span></TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>View and manage your current user credentials through Clerk.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {user?.imageUrl && (
                  <img src={user.imageUrl} alt="User Avatar" className="h-20 w-20 rounded-full border border-border object-cover" />
                )}
                <div>
                  <h3 className="text-lg font-medium">{user?.fullName || "User Account"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                  <p className="text-xs text-muted-foreground mt-1">ID: {user?.id}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={user?.firstName || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={user?.lastName || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Primary Email</Label>
                  <Input value={user?.primaryEmailAddress?.emailAddress || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <Input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""} disabled className="bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose between light, dark, or system theme.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="flex flex-col gap-2 h-20">
                  <Sun className="h-5 w-5" /><span>Light</span>
                </Button>
                <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="flex flex-col gap-2 h-20">
                  <Moon className="h-5 w-5" /><span>Dark</span>
                </Button>
                <Button variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")} className="flex flex-col gap-2 h-20">
                  <Monitor className="h-5 w-5" /><span>System</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accent Color</CardTitle>
              <CardDescription>Choose your dashboard accent color palette.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {accentColors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setAccentColor(c.name)}
                    className={`relative flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-200 ${c.className} ${accentColor === c.name ? "ring-2 ring-offset-2 ring-offset-background ring-accent-base scale-110" : "opacity-70 hover:opacity-100 hover:scale-105"}`}
                  >
                    {accentColor === c.name && <Check className="h-5 w-5 text-white" />}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Current: <span className="font-medium text-foreground capitalize">{accentColor}</span></p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout Density</CardTitle>
              <CardDescription>Customize how content is displayed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Grip className="h-4 w-4 text-muted-foreground" />
                  <div><Label>Compact Mode</Label><p className="text-xs text-muted-foreground">Reduce padding and font sizes for denser display</p></div>
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <div><Label>Reduced Motion</Label><p className="text-xs text-muted-foreground">Minimize animations throughout the dashboard</p></div>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LayoutPanelLeft className="h-4 w-4 text-muted-foreground" />
                  <div><Label>Collapsed Sidebar</Label><p className="text-xs text-muted-foreground">Start with sidebar collapsed by default</p></div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dashboard Widgets</CardTitle>
              <CardDescription>Toggle which widgets appear on your dashboard overview.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChartBar className="h-4 w-4 text-muted-foreground" />
                  <div><Label>Stat Cards</Label><p className="text-xs text-muted-foreground">Show summary statistics</p></div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div><Label>Charts</Label><p className="text-xs text-muted-foreground">Display enrollment and progress charts</p></div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div><Label>Online Users</Label><p className="text-xs text-muted-foreground">Show currently active users</p></div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                  <div><Label>Recent Activity</Label><p className="text-xs text-muted-foreground">Show latest system activity</p></div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure which notifications you receive and how.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Desktop Notifications</Label><p className="text-xs text-muted-foreground">Receive browser push notifications for important alerts</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Email Notifications</Label><p className="text-xs text-muted-foreground">Get email digests for daily activity</p></div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Notification Sound</Label><p className="text-xs text-muted-foreground">Play a sound when new notifications arrive</p></div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings via Clerk.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Account security is managed through Clerk. Click the UserButton in the top-right corner to access your security settings including password changes and multi-factor authentication.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Manage your organization details and branding.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input value="SSP Global" disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Input value="STI TrackSuite" disabled className="bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Sheets Connection</CardTitle>
              <CardDescription>Test backend connectivity and manage cache.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Web App URL</Label>
                <Input value={process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "Not configured"} disabled className="font-mono text-xs bg-muted" />
              </div>
              <div className="flex gap-2">
                <Button onClick={testConnection} disabled={testingConnection}>
                  {testingConnection ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test Connection"}
                </Button>
                <Button variant="outline" onClick={clearCache}>Clear Session Cache</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Viewer</CardTitle>
              <CardDescription>View role-to-permission mappings from the database.</CardDescription>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <Button variant="outline" onClick={loadRoles} disabled={rolesLoading}>
                  {rolesLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</> : "Load Role Permissions"}
                </Button>
              ) : (
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div key={role.roleName} className="rounded-lg border bg-card/50 p-3">
                      <p className="text-sm font-semibold mb-1">{role.roleName}</p>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.map((perm) => (
                          <span key={perm} className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-base">{perm}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Info</CardTitle>
              <CardDescription>System information and build details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Framework</span><span>Next.js 16</span></div>
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">React</span><span>19</span></div>
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Authentication</span><span>Clerk</span></div>
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Data Store</span><span>Google Sheets</span></div>
                <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Build Target</span><span>{typeof window !== "undefined" ? "Browser" : "Server"}</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
