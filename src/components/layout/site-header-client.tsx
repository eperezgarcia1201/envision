"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CompanyLogo } from "@/components/branding/company-logo";

type HeaderUser = {
  username: string;
  role: string;
} | null;

type SiteHeaderClientProps = {
  user: HeaderUser;
};

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/platform", label: "Platform" },
  { href: "/api-docs", label: "API Docs" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SiteHeaderClient({ user }: SiteHeaderClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const role = user?.role;
  const isAdminLike = role === "ADMIN" || role === "MANAGER";

  const links = [...publicLinks];

  if (user) {
    links.push({ href: "/portal", label: "Portal" });
  }

  if (isAdminLike) {
    links.push({ href: "/admin", label: "CRM" });
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Envision Maintenence Home">
          <CompanyLogo size={34} variant="light" withWordmark={true} />
        </Link>

        <nav className="main-nav" aria-label="Main Navigation">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive(pathname, item.href) ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-auth-actions">
          {user ? (
            <>
              <span className="header-user-pill">{user.username}</span>
              <button className="header-logout" type="button" onClick={handleLogout}>
                {loggingOut ? "Signing Out..." : "Sign Out"}
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link nav-link-login" href="/login">
                Login
              </Link>
              <Link className="header-cta" href="/contact">
                Free Estimate
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
