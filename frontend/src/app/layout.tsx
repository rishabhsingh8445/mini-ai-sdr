import type { Metadata } from "next";
import "./globals.css";
import { CopyHandler } from "@/components/ui/CopyHandler";

export const metadata: Metadata = {
  title: "Mini AI SDR | AI-Powered Sales Development",
  description:
    "Qualify leads and generate personalized outreach emails with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CopyHandler />
        {children}
      </body>
    </html>
  );
}
