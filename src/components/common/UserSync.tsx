"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { fetchSheetData, modifySheetData, callSessionAction } from "@/services/api";
import { User, LoginLog, UserRole } from "@/types";

function getDeviceInfo() {
  if (typeof window === "undefined") return { device: "", browser: "" };

  const ua = navigator.userAgent;
  let device = "Desktop";

  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
    device = "Mobile";
    if (/iPad/i.test(ua)) device = "Tablet";
  }

  let browser = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edge")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  return { device, browser };
}

const SESSION_COOLDOWN_MS = 15 * 60 * 1000;
const SESSION_NOTIF_KEY = "last_session_notif_ts";

function shouldCreateSessionNotif(userId: string): boolean {
  const key = SESSION_NOTIF_KEY + userId;
  const last = localStorage.getItem(key);
  if (!last) return true;
  return Date.now() - Number(last) > SESSION_COOLDOWN_MS;
}

function markSessionNotifSent(userId: string) {
  localStorage.setItem(SESSION_NOTIF_KEY + userId, String(Date.now()));
}

function sendLogoutBeacon(userId: string, userEmail: string, userFullName: string) {
  const sessionKey = `user_logged_${userId}`;
  if (sessionStorage.getItem(sessionKey) !== "true") return;

  navigator.sendBeacon(
    process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "",
    JSON.stringify({
      action: "logoutUser",
      data: {
        "User ID": userId,
        "Full Name": userFullName,
        "Email": userEmail,
      },
    })
  );
  sessionStorage.removeItem(sessionKey);
  sessionStorage.removeItem(`user_synced_${userId}`);
}

export function UserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const syncInProgress = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || syncInProgress.current) return;

    const currentUserId = user.id;
    const loggedSessionKey = `user_logged_${currentUserId}`;
    const syncedSessionKey = `user_synced_${currentUserId}`;

    if (sessionStorage.getItem(loggedSessionKey) === "true") return;

    const syncUserSession = async () => {
      syncInProgress.current = true;
      try {
        const userEmail = user.primaryEmailAddress?.emailAddress || "";
        const userFullName = user.fullName || user.username || "User";

        const timestampIST = new Date().toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "medium",
        });

        const existingUsers = await fetchSheetData<User>("Users");
        const existingUser = existingUsers.find((u) => u["User ID"] === currentUserId);

        const userRole = (user.publicMetadata?.role as UserRole) || "Pending";

        if (!existingUser) {
          const newUserRecord: Partial<User> = {
            "User ID": currentUserId,
            "Full Name": userFullName,
            "Email": userEmail,
            "Role": userRole,
          };
          await modifySheetData("create", "Users", newUserRecord);

          const signupLog: Partial<LoginLog> = {
            "User ID": currentUserId,
            "Email": userEmail,
            "Name": userFullName,
            "Action": "Signup",
            "Timestamp (IST)": timestampIST,
          };
          await modifySheetData("create", "LoginLogs", signupLog);
          console.log(`[UserSync] Registered new user: ${userEmail}`);

          await callSessionAction("createNotification", {
            "User ID": currentUserId,
            Title: "Welcome!",
            Message: `Welcome to STI Tracksuite, ${userFullName}!`,
            Type: "success",
          });
        } else {
          if (existingUser["Login Time"] && existingUser["Status"] === "Online") {
            console.log(`[UserSync] User ${userEmail} already logged in this session`);
            sessionStorage.setItem(loggedSessionKey, "true");
            sessionStorage.setItem(syncedSessionKey, "true");
            syncInProgress.current = false;
            return;
          }

          if (existingUser.Status === "Suspended") {
            console.warn(`[UserSync] Suspended user ${userEmail} attempted login`);
            toast.error("Account suspended", { description: "Your account has been suspended. Contact your administrator." });
            window.location.href = "/sign-out";
            return;
          }
        }

        const { device, browser } = getDeviceInfo();
        let ip = "";
        try {
          const ipRes = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
          const ipData = await ipRes.json();
          ip = ipData.ip || "";
        } catch {
        }

        const loginResult = await callSessionAction("loginUser", {
          "User ID": currentUserId,
          "Full Name": userFullName,
          "Email": userEmail,
          "Role": userRole,
          "Device": device,
          "Browser": browser,
          "IP": ip,
        });

        if (!loginResult.success) {
          console.error(`[UserSync] Login failed: ${loginResult.message}`);
          return;
        }

        sessionStorage.setItem(loggedSessionKey, "true");
        sessionStorage.setItem(syncedSessionKey, "true");
        console.log(`[UserSync] Login recorded for: ${userEmail}`);

        if (shouldCreateSessionNotif(currentUserId)) {
          await callSessionAction("createNotification", {
            "User ID": currentUserId,
            Title: "Session Started",
            Message: `You logged in from ${device} (${browser})`,
            Type: "info",
          });
          markSessionNotifSent(currentUserId);
        }
      } catch (err) {
        console.error("[UserSync] Error syncing user session:", err);
        toast.error("Session sync failed", { description: "Some tracking features may not work correctly." });
      } finally {
        syncInProgress.current = false;
      }
    };

    syncUserSession();
  }, [isLoaded, isSignedIn, user]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const userEmail = user.primaryEmailAddress?.emailAddress || "";
    const userFullName = user.fullName || user.username || "User";

    const handleBeforeUnload = () => {
      sendLogoutBeacon(user.id, userEmail, userFullName);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      sendLogoutBeacon(user.id, userEmail, userFullName);
    };
  }, [isLoaded, isSignedIn, user]);

  return null;
}
