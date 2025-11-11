import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "./components/layout/Sidebar";
import AppHeader from "./components/layout/AppHeader";

export const metadata: Metadata = {
  title: "The HUB – GravitySeries",
  description: "Results Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className="h-full">
      <body className="min-h-screen h-full bg-brand-black text-brand-light">
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <main className="flex-1 flex flex-col">
            <AppHeader />
            <div className="flex-1 overflow-auto bg-brand-light p-4">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
