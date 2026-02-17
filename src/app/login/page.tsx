import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CompanyLogo } from "@/components/branding/company-logo";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Role-based operator authentication for Envision Maintenence dashboards.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "560px" }}>
        <article className="panel" style={{ padding: "1.15rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <CompanyLogo size={38} variant="dark" withWordmark={true} />
          </div>
          <p className="section-label">Secure Access</p>
          <h1 className="page-title">Operator Login</h1>
          <p className="page-lead">
            Sign in with your role credentials to access the internal portal and admin console.
          </p>
          <p className="page-lead" style={{ marginTop: "0.5rem" }}>
            Admin default: <strong>admin</strong> / <strong>1234qwer</strong>
          </p>

          <Suspense fallback={<p className="page-lead">Loading login form...</p>}>
            <LoginForm />
          </Suspense>
        </article>
      </div>
    </section>
  );
}
