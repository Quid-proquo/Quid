"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiMenu, HiX } from "react-icons/hi";
import { ComingSoonNavItem } from "@/components/ui/coming-soon";
import {
  getNavConfig,
  isNavItemActive,
  type DashboardMode,
} from "@/components/nav/config";

export default function DashboardSidebar({ mode }: { mode: DashboardMode }) {
  const pathname = usePathname();
  const [expandedPath, setExpandedPath] = useState<string | null>(null);
  const isExpanded = expandedPath === pathname && pathname !== null;
  const config = getNavConfig(mode);
  const navId = `dashboard-sidebar-nav-${mode}`;

  return (
    <aside
      aria-label={config.modeLabel}
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r-[3px] border-foreground bg-card transition-[width] duration-300 md:flex lg:w-64 ${
        isExpanded ? "w-64 p-4" : "w-[72px] p-2 lg:p-4"
      }`}
    >
      <div className="mb-8 border-b-[3px] border-foreground pb-4">
        <div
          className={`flex items-center ${
            isExpanded ? "justify-between" : "justify-center lg:justify-start"
          }`}
        >
          <Image
            src="/logo.png"
            alt={config.logoAlt}
            width={55}
            height={32}
            className={`h-8 shrink-0 ${
              isExpanded ? "w-[55px]" : "w-10 lg:w-[55px]"
            }`}
          />
          <span
            className={`ml-2 text-xs font-black uppercase tracking-wide ${
              isExpanded ? "inline" : "hidden lg:inline"
            }`}
          >
            {config.modeLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            setExpandedPath((current) => (current === pathname ? null : pathname))
          }
          aria-expanded={isExpanded}
          aria-controls={navId}
          aria-label={
            isExpanded
              ? `Collapse ${config.modeLabel} navigation`
              : `Expand ${config.modeLabel} navigation`
          }
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 brutal-border brutal-shadow bg-brutal-cyan px-2 text-xs font-black uppercase text-foreground transition-transform hover:translate-x-[-1px] hover:translate-y-[-1px] md:flex lg:hidden"
        >
          {isExpanded ? <HiX size={18} /> : <HiMenu size={18} />}
          {isExpanded && <span>Collapse</span>}
        </button>
      </div>

      <nav id={navId} aria-label={config.navLabel} className="flex min-h-0 flex-col gap-3">
        {config.items.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href, config.basePath);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 items-center border-l-[4px] py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                isExpanded
                  ? "gap-2 pl-3"
                  : "justify-center px-0 pl-0 lg:justify-start lg:pl-3"
              } ${
                isActive
                  ? `border-brutal-pink text-foreground ${config.activeClassName}`
                  : "border-transparent text-muted-foreground hover:border-brutal-cyan hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              <span
                className={`min-w-0 ${isExpanded ? "inline" : "hidden lg:inline"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div
        className={`mt-6 border-t-[3px] border-foreground pt-4 ${
          isExpanded ? "" : "hidden lg:block"
        }`}
      >
        <p className="mb-2 pl-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Coming soon
        </p>
        <div className="flex flex-col gap-1">
          {config.comingSoon.map(({ feature, icon }) => (
            <ComingSoonNavItem key={feature} feature={feature} icon={icon} />
          ))}
        </div>
      </div>

      <div
        className={`${config.promo.className} ${isExpanded ? "" : "hidden lg:block"}`}
      >
        {config.promo.title && (
          <p className="font-black uppercase tracking-wide">{config.promo.title}</p>
        )}
        {config.promo.description && (
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            {config.promo.description}
          </p>
        )}
      </div>
    </aside>
  );
}
