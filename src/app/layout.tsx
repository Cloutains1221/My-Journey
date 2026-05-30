import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Cloutains的旅程",
  description: "用脚步丈量世界，记录每一段旅程",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-canvas text-ink antialiased min-h-screen font-sans">
        <Nav />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
