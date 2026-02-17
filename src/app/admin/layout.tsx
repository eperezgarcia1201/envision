import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { AdminShell } from "@/components/crm/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await requireRole([UserRole.ADMIN, UserRole.MANAGER], "/admin");

  return (
    <AdminShell
      user={{
        username: currentUser.username,
        role: currentUser.role,
        fullName: currentUser.fullName,
      }}
    >
      {children}
    </AdminShell>
  );
}
