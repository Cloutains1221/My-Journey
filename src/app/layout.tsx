import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "人生旅程",
  description: "记录我走过的每一段旅程",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-bg text-white antialiased min-h-screen">
        <Nav />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
