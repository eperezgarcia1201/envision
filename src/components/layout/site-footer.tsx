import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Envision Maintenence</h3>
          <p>Professional maintenance and construction services across Los Angeles, California.</p>
          <p>
            Future-ready operations for API integrations, SDK growth, and mobile workforce tooling.
          </p>
        </div>

        <div>
          <h4>Company</h4>
          <ul>
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/services">Services</Link>
            </li>
            <li>
              <Link href="/gallery">Gallery</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Platform</h4>
          <ul>
            <li>
              <Link href="/platform">Platform Vision</Link>
            </li>
            <li>
              <Link href="/portal">Operations Portal</Link>
            </li>
            <li>
              <Link href="/admin">Admin Console</Link>
            </li>
            <li>
              <Link href="/api-docs">API Documentation</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Envision Maintenence. All rights reserved.</p>
        <p>Los Angeles, California</p>
      </div>
    </footer>
  );
}
