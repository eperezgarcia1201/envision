import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <p className="section-label">404</p>
        <h1 className="page-title">Page Not Found</h1>
        <p className="page-lead">The page you requested does not exist in the current platform build.</p>
        <div className="action-row" style={{ marginTop: "1rem" }}>
          <Link className="btn btn-primary" href="/">
            Return Home
          </Link>
        </div>
      </div>
    </section>
  );
}
