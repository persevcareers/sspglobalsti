import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AccentThemeProvider } from "@/contexts/AccentThemeContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Track Suite - SSP Global",
  description:
    "Internal application for SSP Global Software Training Institute.",
  keywords: ["training", "student management", "ERP", "education", "SSP Global", "Track Suite"],
  openGraph: {
title: "Track Suite - SSP Global",
    description: "Internal application for SSP Global Software Training Institute.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var a=localStorage.getItem("accent-color")||"indigo",p={indigo:{base:"#6366f1",heavy:"#4f46e5",soft:"rgba(99,102,241,0.1)",fg:"#fff",ring:"rgba(99,102,241,0.25)",glow:"rgba(99,102,241,0.6)"},emerald:{base:"#10b981",heavy:"#059669",soft:"rgba(16,185,129,0.1)",fg:"#fff",ring:"rgba(16,185,129,0.25)",glow:"rgba(16,185,129,0.6)"},amber:{base:"#f59e0b",heavy:"#d97706",soft:"rgba(245,158,11,0.1)",fg:"#000",ring:"rgba(245,158,11,0.25)",glow:"rgba(245,158,11,0.6)"},rose:{base:"#f43f5e",heavy:"#e11d48",soft:"rgba(244,63,94,0.1)",fg:"#fff",ring:"rgba(244,63,94,0.25)",glow:"rgba(244,63,94,0.6)"},violet:{base:"#8b5cf6",heavy:"#7c3aed",soft:"rgba(139,92,246,0.1)",fg:"#fff",ring:"rgba(139,92,246,0.25)",glow:"rgba(139,92,246,0.6)"},cyan:{base:"#06b6d4",heavy:"#0891b2",soft:"rgba(6,182,212,0.1)",fg:"#000",ring:"rgba(6,182,212,0.25)",glow:"rgba(6,182,212,0.6)"}},c=p[a]||p.indigo;var r=document.documentElement;r.style.setProperty("--accent-base",c.base),r.style.setProperty("--accent-heavy",c.heavy),r.style.setProperty("--accent-soft",c.soft),r.style.setProperty("--accent-fg",c.fg),r.style.setProperty("--accent-ring",c.ring),r.style.setProperty("--accent-glow",c.glow)}catch(e){}}());`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClerkProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AccentThemeProvider>
              <SettingsProvider>
                <TooltipProvider>
                  {children}
                  <Toaster richColors position="top-right" />
                </TooltipProvider>
              </SettingsProvider>
            </AccentThemeProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
