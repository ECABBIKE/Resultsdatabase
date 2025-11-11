"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Upload, Users, Medal, Home, Calendar, Settings, Award, FileText, Palette } from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navigationItems: NavItem[] = [
  { title: "Hem",           href: "/dashboard",         icon: Home },
  { title: "Tävlingar",     href: "/results",           icon: Trophy },
  { title: "Serietabeller", href: "/series/standings",  icon: Medal },
  { title: "Cyklister",     href: "/riders",            icon: Users },
];

const adminItems: NavItem[] = [
  { title: "Exportera Design",    href: "/admin/theme-export",     icon: Palette },
  { title: "Importmallar",        href: "/admin/import-templates", icon: FileText },
  { title: "Hantera Event",       href: "/admin/events",           icon: Calendar },
  { title: "Hantera Serier",      href: "/admin/series",           icon: Settings },
  { title: "Hantera Kvalpoäng",   href: "/admin/qualification",    icon: Award },
  { title: "Ladda upp resultat",  href: "/admin/upload",           icon: Upload },
];

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-xs font-semibold uppercase tracking-wider px-3 py-3 text-brand-yellow">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function NavButton({ item, active, admin }: { item: NavItem; active: boolean; admin?: boolean }) {
  const Icon = item.icon;

  const buttonStyle = active
    ? admin
      ? { backgroundColor: "#EF761F" }
      : { background: "linear-gradient(to right, #004a98, #437264)" }
    : {};

  const iconStyle = !active
    ? { color: admin ? "#EF761F" : "#437264" }
    : {};

  return (
    <Link
      href={item.href}
      className={`group relative mb-1 flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 w-full
        ${active ? "text-white shadow-lg" : "hover:bg-slate-800 text-brand-light"}`}
      style={buttonStyle}
    >
      <Icon
        className="h-5 w-5 transition-transform group-hover:scale-110"
        style={iconStyle}
      />
      <span className="text-sm font-semibold">{item.title}</span>
      {active && (
        <span
          className="absolute right-2 h-1.5 w-1.5 animate-pulse rounded-full bg-brand-yellow"
        />
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className="hidden md:flex w-[280px] shrink-0 flex-col border-r backdrop-blur-xl"
      style={{ borderColor: "#323539", backgroundColor: "rgba(23,23,23,0.95)" }}
    >
      <div className="border-b p-6" style={{ borderColor: "#323539" }}>
        <div className="flex flex-col gap-3 items-center">
          <Image
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690747c6a611d883c6ee363c/f5b51581e_GravitySeries.pdf"
            alt="Gravity Series"
            width={240}
            height={64}
            className="h-16 w-auto object-contain invert"
          />
          <div className="text-center">
            <h2 className="font-bold text-lg text-brand-light">The HUB</h2>
            <p className="text-xs font-medium text-brand-yellow">Results Platform</p>
          </div>
        </div>
      </div>

      <nav className="p-3">
        <Section label="Navigation">
          {navigationItems.map((item) => (
            <NavButton
              key={item.title}
              item={item}
              active={isActive(item.href)}
            />
          ))}
        </Section>

        <Section label="Administration">
          {adminItems.map((item) => (
            <NavButton
              key={item.title}
              item={item}
              active={isActive(item.href)}
              admin
            />
          ))}
        </Section>
      </nav>
    </aside>
  );
}
