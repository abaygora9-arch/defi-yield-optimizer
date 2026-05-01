import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "DeFi Yield Optimizer",
  description: "Multi-factor DeFi yield analysis, risk modeling, and strategy optimization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased bg-mesh">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
