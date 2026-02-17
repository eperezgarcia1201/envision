"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation } from "@/lib/admin-navigation";
import { LogoutButton } from "@/components/forms/logout-button";

type AdminShellProps = {
  user: {
    username: string;
    role: string;
    fullName: string | null;
  };
  children: React.ReactNode;
};

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="crm-layout">
      <header className="crm-topbar">
        <div className="crm-brand-row">
          <Link href="/admin" className="crm-brand" aria-label="CRM Dashboard Home">
            <span className="crm-brand-mark">EM</span>
            <span>
              ENVISION <strong>Maintenence</strong>
            </span>
          </Link>

          <nav className="crm-topnav" aria-label="CRM Top Navigation">
            {adminNavigation.slice(0, 6).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`crm-topnav-link${isActive(pathname, item.href) ? " active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="crm-topbar-actions">
          <details className="crm-create-menu">
            <summary className="crm-create-btn">Create New +</summary>
            <div className="crm-create-menu-list">
              <Link href="/admin/leads?create=1">Lead</Link>
              <Link href="/admin/work-orders?create=1">Work Order</Link>
              <Link href="/admin/clients?create=1">Client</Link>
              <Link href="/admin/properties?create=1">Property</Link>
              <Link href="/admin/estimates?create=1">Estimate</Link>
              <Link href="/admin/invoices?create=1">Invoice</Link>
              <Link href="/admin/employees?create=1">Employee</Link>
              <Link href="/admin/schedule?create=1">Schedule Item</Link>
            </div>
          </details>
          <label className="crm-search-wrap" htmlFor="crm-search-input">
            <span className="crm-search-icon">⌕</span>
            <input id="crm-search-input" type="search" placeholder="Use page-level search in each module..." />
          </label>
          <div className="crm-user-chip">
            <span className="crm-user-avatar">{(user.fullName ?? user.username).slice(0, 1).toUpperCase()}</span>
            <span>
              {user.fullName ?? user.username}
              <small>{user.role}</small>
            </span>
          </div>
        </div>
      </header>

      <div className="crm-main-grid">
        <aside className="crm-sidebar">
          <nav aria-label="CRM Sidebar">
            <ul className="crm-side-list">
              {adminNavigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`crm-side-link${isActive(pathname, item.href) ? " active" : ""}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="crm-sidebar-user">
            <p>{user.fullName ?? user.username}</p>
            <span>{user.role} access</span>
            <LogoutButton />
          </div>
        </aside>

        <main className="crm-content">{children}</main>
      </div>
    </div>
  );
}
