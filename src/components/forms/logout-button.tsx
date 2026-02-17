"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleLogout() {
    if (submitting) return;

    setSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
      setSubmitting(false);
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={handleLogout} disabled={submitting}>
      {submitting ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
