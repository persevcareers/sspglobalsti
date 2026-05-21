"use client";

import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Database, Settings, ShieldAlert, Monitor, Moon, Sun, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isLoaded, user } = useUser();
  const [testingConnection, setTestingConnection] = useState(false);

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) {
        throw new Error("Google Script URL is not configured");
      }
      
      const response = await fetch(`${scriptUrl}?action=read&sheet=Courses`, {
        method: "GET",
      });
      
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

  if (!isLoaded) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="backend" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backend
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                View and manage your current user credentials through Clerk.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {user?.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt="User Avatar"
                    className="h-20 w-20 rounded-full border border-border object-cover"
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium">{user?.fullName || "User Account"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {user?.id}
                  </p>
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
                  <Label>Primary Email Address</Label>
                  <Input value={user?.primaryEmailAddress?.emailAddress || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Account Created</Label>
                  <Input
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Sheets Backend Settings */}
        <TabsContent value="backend" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Sheets Database</CardTitle>
              <CardDescription>
                Details regarding the connected Google Apps Script deployment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="web-app-url">Google Apps Script Web App URL</Label>
                <Input
                  id="web-app-url"
                  value={process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "Not configured"}
                  disabled
                  className="font-mono text-xs bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apps-script-url">Alt Google Apps Script URL</Label>
                <Input
                  id="apps-script-url"
                  value={process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "Not configured"}
                  disabled
                  className="font-mono text-xs bg-muted"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldAlert className="h-4 w-4 text-yellow-500" />
                  <span>Connection URL is managed via local server environment configuration.</span>
                </div>
                <Button onClick={testConnection} disabled={testingConnection} className="w-full sm:w-auto">
                  {testingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences / Theme Settings */}
        <TabsContent value="preferences" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>
                Customize the visual look and theme of the dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="flex flex-col gap-2 h-20"
                >
                  <Sun className="h-5 w-5" />
                  <span>Light</span>
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="flex flex-col gap-2 h-20"
                >
                  <Moon className="h-5 w-5" />
                  <span>Dark</span>
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="flex flex-col gap-2 h-20"
                >
                  <Monitor className="h-5 w-5" />
                  <span>System</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
