import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/services/wallet";

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
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
