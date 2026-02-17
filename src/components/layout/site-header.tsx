"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/content";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Envision Maintenence Home">
          <span className="brand-mark">EM</span>
          <span>
            Envision <strong>Maintenence</strong>
          </span>
        </Link>

        <nav className="main-nav" aria-label="Main Navigation">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive(pathname, item.href) ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="header-cta" href="/contact">
          Free Estimate
        </Link>
      </div>
    </header>
  );
}
