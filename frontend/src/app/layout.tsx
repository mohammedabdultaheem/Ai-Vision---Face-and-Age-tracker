import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";

export const metadata: Metadata = {
  title: "AI VISION – Enterprise AI Face Detection & Age Estimation Platform",
  description: "Enterprise SaaS platform for real-time webcam face detection, image analysis, approximate age estimation, and AI model governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-navy-950 text-slate-100 antialiased min-h-screen selection:bg-electric-500/30 selection:text-electric-300">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
