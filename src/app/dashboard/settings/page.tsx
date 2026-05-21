"use client";

import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { fadeIn, staggerContainer, statCardVariants } from "@/lib/animations";

const INPUT_CLASS = "h-9 border-white/[0.08] bg-white/[0.04] text-sm text-foreground placeholder:text-muted-foreground/40 focus-visible:border-indigo-500/50 focus-visible:ring-[3px] focus-visible:ring-indigo-500/20 transition-all duration-200";

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Key },
  { id: "integrations", label: "Integrations", icon: Globe },
] as const;

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

function ToggleSwitch({ label, description, defaultChecked }: { label: string; description?: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked || false);
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground/60">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/[0.08] transition-colors duration-200",
          checked ? "bg-indigo-500" : "bg-white/[0.06]"
        )}
      >
        <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200", checked ? "translate-x-[22px]" : "translate-x-[3px]")} />
      </button>
    </div>
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
              ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
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
  const { setTheme } = useTheme();
  const { isLoaded, user } = useUser();
  const [testingConnection, setTestingConnection] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) throw new Error("Google Script URL is not configured");
      const response = await fetch(`${scriptUrl}?action=read&sheet=Courses`, { method: "GET" });
      if (response.ok) toast.success("Successfully connected to Google Sheets backend!");
      else toast.error("Connected to server, but returned an error response.");
    } catch (e: any) {
      toast.error(e.message || "Failed to reach Google Sheets API.");
    } finally {
      setTestingConnection(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground/70">Manage your account, organization, and application preferences.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 border-white/[0.08] text-xs" onClick={() => { toast.success("Settings saved"); }}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Save Changes
        </Button>
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
                    ? "bg-indigo-500/10 text-indigo-400"
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

              <SettingCard title="Account Activity" description="Recent login sessions and device information.">
                <div className="space-y-3">
                  {[
                    { device: "Chrome on Windows", time: "Active now", current: true },
                    { device: "Safari on iPhone", time: "2 hours ago", current: false },
                  ].map(({ device, time, current }) => (
                    <div key={device} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-foreground">{device}</p>
                          <p className="text-xs text-muted-foreground/60">{time}</p>
                        </div>
                      </div>
                      {current && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Current
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </SettingCard>
            </motion.div>
          )}

          {activeTab === "organization" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Organization Details" description="Your training institute profile and branding.">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Organization Name", value: "SSP Global" },
                    { label: "Platform", value: "STI TrackSuite" },
                    { label: "Contact Email", value: "admin@sspglobal.com" },
                    { label: "Timezone", value: "Asia/Kolkata (IST, UTC+5:30)" },
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
                        <div className="h-8 w-8 rounded-lg border border-white/[0.06]" style={{ backgroundColor: "#6366f1" }} />
                        <Input value="#6366f1" className={cn(INPUT_CLASS, "font-mono text-xs")} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground/60">Logo URL</Label>
                      <Input placeholder="https://example.com/logo.png" className={INPUT_CLASS} />
                    </div>
                  </div>
                </div>
              </SettingCard>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Email Notifications" description="Control which emails you receive from the platform.">
                <div className="space-y-4">
                  <ToggleSwitch label="New Lead Alerts" description="Get notified when a new lead is captured" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Student Enrollment" description="Receive updates when students are enrolled" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Schedule Changes" description="Notify on batch schedule modifications" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Daily Digest" description="Receive a summary of daily activity" />
                </div>
              </SettingCard>

              <SettingCard title="Push Notifications" description="Browser notification preferences.">
                <div className="space-y-4">
                  <ToggleSwitch label="Desktop Notifications" description="Show notifications in your browser" defaultChecked />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Session Alerts" description="Notify on important status changes" />
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
                      <p className="text-sm font-medium text-foreground">Session Management</p>
                      <p className="text-xs text-muted-foreground/60">Active sessions are tracked and managed</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 border-white/[0.08] text-xs">
                      <RefreshCw className="h-3 w-3" />
                      Revoke All
                    </Button>
                  </div>
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Idle Session Timeout" description="Automatically log out after 15 minutes of inactivity" defaultChecked />
                </div>
              </SettingCard>
            </motion.div>
          )}

          {activeTab === "integrations" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Google Sheets Backend" description="Connected Google Apps Script deployment for data storage.">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground/60">Web App URL</Label>
                    <Input value={process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "Not configured"} disabled className={cn(INPUT_CLASS, "font-mono text-xs cursor-not-allowed opacity-70")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground/60">Alt Script URL</Label>
                    <Input value={process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "Not configured"} disabled className={cn(INPUT_CLASS, "font-mono text-xs cursor-not-allowed opacity-70")} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldAlert className="h-4 w-4 text-amber-400" />
                      <span>Connection URL managed via environment configuration.</span>
                    </div>
                    <Button onClick={testConnection} disabled={testingConnection} size="sm" className="h-8 gap-1.5 text-xs">
                      {testingConnection ? <><Loader2 className="h-3 w-3 animate-spin" /> Testing</> : "Test Connection"}
                    </Button>
                  </div>
                </div>
              </SettingCard>

              <SettingCard title="Available Integrations" description="Connect with third-party tools and services.">
                <div className="space-y-3">
                  {[
                    { name: "Google Calendar", description: "Sync schedules and events", icon: Clock, connected: true },
                    { name: "Slack", description: "Get notifications in Slack channels", icon: Bell, connected: false },
                    { name: "Zapier", description: "Connect with 3000+ apps", icon: Globe, connected: false },
                  ].map(({ name, description, icon: Icon, connected }) => (
                    <div key={name} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04]">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground/60">{description}</p>
                        </div>
                      </div>
                      {connected ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 gap-1 border-white/[0.08] text-[10px]">
                          <Plus className="h-3 w-3" /> Connect
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </SettingCard>
            </motion.div>
          )}

          {activeTab === "preferences" && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
              <SettingCard title="Theme Preferences" description="Customize the visual appearance of the dashboard.">
                <ThemeSelector />
              </SettingCard>

              <SettingCard title="Display Options" description="Configure how data is displayed across the platform.">
                <div className="space-y-4">
                  <ToggleSwitch label="Compact Mode" description="Use denser layouts for tables and cards" />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Reduced Motion" description="Disable animations for better performance" />
                  <Separator className="bg-white/[0.04]" />
                  <ToggleSwitch label="Show Weekend Schedules" description="Display Saturday and Sunday schedules" defaultChecked />
                </div>
              </SettingCard>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import { Badge } from "@/components/ui/badge";
