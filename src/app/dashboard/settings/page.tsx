"use client";

import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Database,
  Monitor,
  ShieldAlert,
  Moon,
  Sun,
  Loader2,
  Bell,
  Key,
  Globe,
  Palette,
  RefreshCw,
  CheckCircle2,
  Building2,
  Smartphone,
  Mail,
  Layout,
  Trash2,
  AlertTriangle,
  Info,
  Clock,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { fadeIn, staggerContainer } from "@/lib/animations";
import { useAccentTheme } from "@/hooks/useAccentTheme";
import { useSettings } from "@/hooks/useSettings";
import { INPUT_CLASS } from "@/constants/styles";
import { BRANDING } from "@/constants/branding";
import { loadRoles, type RoleEntry } from "@/services/roles";
import { useEffect } from "react";

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Key },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "system", label: "System", icon: Database },
] as const;

function ToggleSwitch({ label, description, checked: controlledChecked, onChange, defaultChecked }: { label: string; description?: string; checked?: boolean; onChange?: (checked: boolean) => void; defaultChecked?: boolean }) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground/60">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => {
          if (isControlled) {
            onChange?.(!checked);
          } else {
            setInternalChecked(!checked);
            onChange?.(!checked);
          }
        }}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/[0.08] transition-colors duration-200",
          checked ? "bg-accent-base" : "bg-white/[0.06]"
        )}
      >
        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200", checked ? "translate-x-[22px]" : "translate-x-[3px]")} />
      </button>
    </div>
  );
}

function SettingCard({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("border-white/[0.06] bg-card shadow-none", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription className="text-xs text-muted-foreground/60">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200",
            theme === id
              ? "border-accent-base/30 bg-accent-soft text-accent-base"
              : "border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:border-white/[0.10] hover:text-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const { isLoaded, user } = useUser();
  const { accentColor, setAccentColor, accentColors } = useAccentTheme();
  const { settings, updateSetting } = useSettings();
  const [testingConnection, setTestingConnection] = useState(false);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    loadRoles().then((r) => { setRoles(r); setRolesLoading(false); });
  }, []);
  const [clearingCache, setClearingCache] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showApiKey, setShowApiKey] = useState(false);

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) throw new Error("Google Script URL is not configured");
      const response = await fetch(`${scriptUrl}?action=ping`, { method: "GET" });
      const text = await response.text();
      const data = JSON.parse(text);
      if (data.success) {
        toast.success("Connected to Google Sheets backend", { description: `Response: ${data.message}` });
      } else {
        toast.error("Backend returned an error", { description: data.message });
      }
    } catch (e: any) {
      toast.error("Connection failed", { description: e.message || "Could not reach the Google Sheets API." });
    } finally {
      setTestingConnection(false);
    }
  };

  const clearCache = async () => {
    setClearingCache(true);
    await new Promise((r) => setTimeout(r, 800));
    if (typeof window !== "undefined") {
      sessionStorage.clear();
    }
    setClearingCache(false);
    toast.success("Cache cleared", { description: "All cached data has been invalidated." });
  };

  if (!isLoaded) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-base" />
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Manage your account, preferences, and system configuration.</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="lg:w-56 shrink-0">
          <div className="flex flex-row gap-1 overflow-x-auto lg:flex-col scrollbar-thin">
            {SETTINGS_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap lg:w-full",
                  activeTab === id
                    ? "bg-accent-soft text-accent-base"
                    : "text-muted-foreground/60 hover:bg-white/[0.04] hover:text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="flex-1 space-y-4">
          {activeTab === "profile" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Account Details" description="View and manage your current user credentials through Clerk.">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  {user?.imageUrl && (
                    <img src={user.imageUrl} alt="User Avatar" className="h-16 w-16 rounded-xl border border-white/[0.06] object-cover" />
                  )}
                  <div>
                    <h3 className="text-lg font-medium text-foreground">{user?.fullName || "User Account"}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{user?.primaryEmailAddress?.emailAddress}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">ID: {user?.id}</p>
                  </div>
                </div>
              </SettingCard>

              <SettingCard title="Personal Information" description="Account details synced from Clerk authentication.">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: "First Name", value: user?.firstName || "—" },
                    { label: "Last Name", value: user?.lastName || "—" },
                    { label: "Email Address", value: user?.primaryEmailAddress?.emailAddress || "—" },
                    { label: "Account Created", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground/60">{label}</Label>
                      <Input value={value} disabled className={cn(INPUT_CLASS, "cursor-not-allowed opacity-70")} />
                    </div>
                  ))}
                </div>
              </SettingCard>

              <SettingCard title="Activity Timeline" description="Recent login sessions and device activity.">
                <div className="space-y-3">
                  {[
                    { device: "Chrome on Windows", ip: "203.0.113.42", time: "Active now", current: true },
                    { device: "Safari on iPhone", ip: "198.51.100.7", time: "2 hours ago", current: false },
                    { device: "Firefox on macOS", ip: "192.0.2.15", time: "Yesterday at 3:42 PM", current: false },
                  ].map(({ device, ip, time, current }) => (
                    <div key={device} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-foreground">{device}</p>
                          <p className="text-xs text-muted-foreground/60">{ip} &middot; {time}</p>
                        </div>
                      </div>
                      {current ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                          Current
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">Inactive</span>
                      )}
                    </div>
                  ))}
                </div>
              </SettingCard>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Theme" description="Customize the visual appearance of the dashboard.">
                <ThemeSelector />
              </SettingCard>

              <SettingCard title="Accent Color" description="Choose your preferred accent color for the UI.">
                <div className="flex gap-3 flex-wrap">
                  {(Object.entries(accentColors) as [string, { base: string }][]).map(([name, palette]) => {
                    const isActive = accentColor === name;
                    return (
                      <button
                        key={name}
                        className={cn(
                          "group relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
                          isActive ? "scale-110 ring-2 ring-accent-ring ring-offset-2 ring-offset-background" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: palette.base }}
                        onClick={() => setAccentColor(name as any)}
                      >
                        {isActive && (
                          <Check className="h-4 w-4 text-white drop-shadow-sm" />
                        )}
                        <span className="absolute -bottom-5 text-[9px] whitespace-nowrap font-medium opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity">
                          {name.charAt(0).toUpperCase() + name.slice(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SettingCard>

              <SettingCard title="Layout Preferences" description="Configure how data is displayed across the platform.">
                <div className="space-y-4">
                  <ToggleSwitch label="Compact Mode" description="Use denser layouts for tables and cards" checked={settings.compactMode} onChange={(v) => updateSetting("compactMode", v)} />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Reduced Motion" description="Disable animations for better performance" checked={settings.reducedMotion} onChange={(v) => updateSetting("reducedMotion", v)} />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Show Weekend Schedules" description="Display Saturday and Sunday schedules" checked={settings.showWeekends} onChange={(v) => updateSetting("showWeekends", v)} />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Collapsed Sidebar" description="Start with sidebar collapsed by default" checked={settings.collapsedSidebar} onChange={(v) => updateSetting("collapsedSidebar", v)} />
                </div>
              </SettingCard>

              <SettingCard title="Dashboard Widgets" description="Choose which widgets appear on your dashboard.">
                <div className="space-y-4">
                  <ToggleSwitch label="Stat Cards" description="Show summary statistics at the top" checked={settings.showStatCards} onChange={(v) => updateSetting("showStatCards", v)} />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Charts" description="Display enrollment and progress charts" checked={settings.showCharts} onChange={(v) => updateSetting("showCharts", v)} />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Online Users" description="Show active user count" checked={settings.showOnlineUsers} onChange={(v) => updateSetting("showOnlineUsers", v)} />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Recent Activity" description="Display recent platform activity" checked={settings.showRecentActivity} onChange={(v) => updateSetting("showRecentActivity", v)} />
                </div>
              </SettingCard>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Session Alerts" description="Control notifications about your account activity.">
                <div className="space-y-4">
                  <ToggleSwitch label="New Login Alerts" description="Get notified when you log in from a new device" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Session Timeout" description="Alert when your session is about to expire" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Security Events" description="Notify on password changes and security updates" defaultChecked />
                </div>
              </SettingCard>

              <SettingCard title="Schedule Notifications" description="Manage schedule-related alerts.">
                <div className="space-y-4">
                  <ToggleSwitch label="Upcoming Sessions" description="Remind me before scheduled sessions start" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Schedule Changes" description="Notify when schedules are modified" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Attendance Alerts" description="Get notified on student attendance updates" />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Daily Digest" description="Receive a summary of daily activity" />
                </div>
              </SettingCard>

              <SettingCard title="Email Preferences" description="Control which emails you receive.">
                <div className="space-y-4">
                  <ToggleSwitch label="New Lead Alerts" description="Get emailed when a new lead is captured" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Student Enrollment" description="Receive emails when students enroll" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Weekly Report" description="Weekly summary of all activity" />
                </div>
              </SettingCard>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Authentication" description="Manage your authentication methods and security settings.">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Authentication Provider</p>
                      <p className="text-xs text-muted-foreground/60">Clerk handles all authentication flows</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px]">Active</Badge>
                  </div>
                  <Separator className="bg-white/[0.04]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Multi-factor Authentication</p>
                      <p className="text-xs text-muted-foreground/60">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 border-white/[0.08] text-xs">Configure</Button>
                  </div>
                </div>
              </SettingCard>

              <SettingCard title="Session Management" description="Manage active sessions across devices.">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Active Sessions</p>
                      <p className="text-xs text-muted-foreground/60">3 active sessions across devices</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 border-red-500/20 text-red-400 hover:text-red-300 text-xs hover:bg-red-500/10">
                      <Trash2 className="h-3 w-3" />
                      Revoke All
                    </Button>
                  </div>
                  <Separator className="bg-white/[0.04]" />
                  {[
                    { device: "Chrome on Windows", location: "Hyderabad, India", lastActive: "Active now" },
                    { device: "Safari on iPhone", location: "Hyderabad, India", lastActive: "2 hours ago" },
                    { device: "Firefox on macOS", location: "Mumbai, India", lastActive: "Yesterday" },
                  ].map(({ device, location, lastActive }) => (
                    <div key={device} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-medium text-foreground">{device}</p>
                          <p className="text-[10px] text-muted-foreground/50">{location} &middot; {lastActive}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground/50 hover:text-red-400">Revoke</Button>
                    </div>
                  ))}
                </div>
              </SettingCard>

              <SettingCard title="Security Policies" description="Configure security preferences.">
                <div className="space-y-4">
                  <ToggleSwitch label="Idle Session Timeout" description="Automatically log out after 15 minutes of inactivity" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Login Notifications" description="Email me when a new device logs in" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="IP Tracking" description="Log IP addresses for all login events" defaultChecked />
                </div>
              </SettingCard>
            </motion.div>
          )}

          {activeTab === "organization" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Organization Details" description="Your training institute profile and branding.">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Organization Name", value: BRANDING.organizationName },
                    { label: "Platform", value: BRANDING.platformName },
                    { label: "Contact Email", value: BRANDING.contactEmail },
                    { label: "Branch", value: "Head Office" },
                    { label: "Timezone", value: "Asia/Kolkata (IST, UTC+5:30)" },
                    { label: "Date Format", value: "DD/MM/YYYY" },
                  ].map(({ label, value }) => (
                    <div key={label} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground/60">{label}</Label>
                      <Input value={value} disabled className={cn(INPUT_CLASS, "cursor-not-allowed opacity-70")} />
                    </div>
                  ))}
                </div>
              </SettingCard>

              <SettingCard title="Branding" description="Customize the look and feel of your instance.">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground/60">Primary Color</Label>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg border border-white/[0.06]" style={{ backgroundColor: accentColors[accentColor].base }} />
                        <Input value={accentColors[accentColor].base} readOnly className={cn(INPUT_CLASS, "font-mono text-xs")} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground/60">Logo URL</Label>
                      <Input placeholder="https://example.com/logo.png" className={INPUT_CLASS} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground/60">Organization settings are stored locally and applied on page load.</p>
                  </div>
                </div>
              </SettingCard>
            </motion.div>
          )}

          {activeTab === "system" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Google Sheets Backend" description="Connected Google Apps Script deployment for data storage.">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground/60">Web App URL</Label>
                    <Input value={process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "Not configured"} disabled className={cn(INPUT_CLASS, "font-mono text-xs cursor-not-allowed opacity-70")} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Database className="h-4 w-4 text-accent-base" />
                      <span>Connection to Google Sheets backend.</span>
                    </div>
                    <Button onClick={testConnection} disabled={testingConnection} size="sm" className="h-8 gap-1.5 text-xs">
                      {testingConnection ? <><Loader2 className="h-3 w-3 animate-spin" /> Testing</> : "Test Connection"}
                    </Button>
                  </div>
                </div>
              </SettingCard>

              <SettingCard title="Cache & Performance" description="Manage application cache and data freshness.">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">In-Memory Cache</p>
                      <p className="text-xs text-muted-foreground/60">30-second TTL with request deduplication</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px]">Active</Badge>
                  </div>
                  <Separator className="bg-white/[0.04]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Sync Status</p>
                      <p className="text-xs text-muted-foreground/60">Data syncs in real-time via API calls</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-400 text-[10px]">Online</Badge>
                  </div>
                  <Separator className="bg-white/[0.04]" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Client Cache</p>
                      <p className="text-xs text-muted-foreground/60">Session storage & in-memory cache</p>
                    </div>
                    <Button onClick={clearCache} disabled={clearingCache} variant="outline" size="sm" className="h-8 gap-1.5 border-white/[0.08] text-xs">
                      {clearingCache ? <><Loader2 className="h-3 w-3 animate-spin" /> Clearing</> : <><RefreshCw className="h-3 w-3" /> Clear Cache</>}
                    </Button>
                  </div>
                </div>
              </SettingCard>

              <SettingCard title="Environment" description="Current runtime environment information.">
                <div className="space-y-3">
                  {[
                    { label: "Next.js", value: "16.2.6" },
                    { label: "React", value: "19.1.0" },
                    { label: "Clerk", value: "v7" },
                    { label: "Build Target", value: "Production" },
                    { label: "Data Store", value: "Google Sheets (via Apps Script)" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
                      <span className="text-xs text-muted-foreground/60">{label}</span>
                      <span className="text-xs font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </SettingCard>

              <SettingCard title="Role Permissions" description="Role-based access control loaded from the Roles sheet.">
                {rolesLoading ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : Object.keys(roles).length === 0 ? (
                  <p className="text-sm text-muted-foreground/60">No roles loaded. Using default permissions.</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(roles).map(([roleName, permissions]) => (
                      <div key={roleName}>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{roleName}</span>
                          {permissions.includes("ALL") && <Badge variant="outline" className="border-accent-base/20 bg-accent-soft text-[10px] text-accent-base">Full Access</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {permissions.filter((p) => p !== "ALL").map((perm) => (
                            <span key={perm} className="inline-flex rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted-foreground/80">
                              {perm.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SettingCard>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
