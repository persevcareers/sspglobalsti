import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AccentThemeProvider } from "@/components/common/AccentThemeContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "STI Tracksuite - SSP Global",
  description:
    "Enterprise training and student management automation platform for SSP Global.",
  keywords: ["training", "student management", "ERP", "education", "SSP Global", "STI Tracksuite"],
  openGraph: {
    title: "STI Tracksuite - SSP Global",
    description: "Enterprise training and student management automation platform.",
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
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              const accent = localStorage.getItem('accent-color');
              if (accent === 'indigo' || accent === 'blue' || accent === 'green' || accent === 'red' || accent === 'purple' || accent === 'orange') {
                document.documentElement.setAttribute('data-accent', accent);
              } else {
                document.documentElement.setAttribute('data-accent', 'indigo');
              }
              const compact = localStorage.getItem('compact-mode');
              if (compact === 'true') {
                document.documentElement.classList.add('compact-mode');
              }
            } catch (e) {}
          `}
        </Script>
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
              <TooltipProvider>
                {children}
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </AccentThemeProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
