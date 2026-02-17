import type { Metadata } from "next";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { enumLabel } from "@/lib/crm";
import { requireRole } from "@/lib/auth";
import { ResourceCrud } from "@/components/crm/resource-crud";

export const metadata: Metadata = {
  title: "Settings | CRM",
  description: "Admin-level account and service package configuration.",
};

export default async function AdminSettingsPage() {
  await requireRole(UserRole.ADMIN, "/admin/settings");

  const [userAccounts, clients, servicePackages] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        username: true,
        role: true,
        fullName: true,
        clientId: true,
        client: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { username: "asc" }],
      take: 100,
    }),
    prisma.client.findMany({
      orderBy: [{ companyName: "asc" }],
      select: { id: true, companyName: true },
    }),
    prisma.servicePackage.findMany({
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      take: 100,
    }),
  ]);

  const roleOptions = Object.values(UserRole).map((role) => ({
    value: role,
    label: enumLabel(role),
  }));

  return (
    <div className="crm-stack">
      <ResourceCrud
        title="User Accounts"
        description="Manage platform users and role access."
        endpoint="/api/users"
        singularName="User"
        initialItems={userAccounts}
        searchKeys={["username", "fullName", "role", "client.companyName"]}
        filters={[{ name: "role", label: "Role", options: roleOptions }]}
        defaultValues={{ role: "CLIENT" }}
        columns={[
          { key: "username", label: "Username" },
          { key: "fullName", label: "Full Name", empty: "-" },
          { key: "role", label: "Role", format: "pill" },
          { key: "client.companyName", label: "Client", empty: "-" },
          { key: "createdAt", label: "Created", format: "date" },
        ]}
        fields={[
          { name: "username", label: "Username", type: "text", required: true },
          {
            name: "password",
            label: "Password",
            type: "password",
            requiredOnCreate: true,
            placeholder: "Required for create. Leave blank to keep unchanged on edit.",
          },
          { name: "fullName", label: "Full Name", type: "text" },
          { name: "role", label: "Role", type: "select", required: true, options: roleOptions },
          {
            name: "clientId",
            label: "Linked Client",
            type: "select",
            options: clients.map((client) => ({ value: client.id, label: client.companyName })),
          },
        ]}
      />

      <ResourceCrud
        title="Service Packages"
        description="Manage published service offerings and SLA settings."
        endpoint="/api/service-packages"
        singularName="Service Package"
        initialItems={servicePackages}
        searchKeys={["name", "slug", "coverageArea", "startingPrice"]}
        filters={[
          {
            name: "featured",
            label: "Featured",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
        ]}
        defaultValues={{ featured: "false" }}
        columns={[
          { key: "slug", label: "Slug" },
          { key: "name", label: "Name" },
          { key: "responseSlaHours", label: "SLA Hours" },
          { key: "coverageArea", label: "Coverage" },
          { key: "startingPrice", label: "Price" },
          { key: "featured", label: "Featured", format: "boolean" },
        ]}
        fields={[
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "name", label: "Name", type: "text", required: true },
          { name: "summary", label: "Summary", type: "textarea", required: true },
          {
            name: "responseSlaHours",
            label: "Response SLA Hours",
            type: "number",
            valueType: "number",
            required: true,
            step: "1",
          },
          { name: "coverageArea", label: "Coverage Area", type: "text", required: true },
          { name: "startingPrice", label: "Starting Price", type: "text", required: true },
          {
            name: "featured",
            label: "Featured",
            type: "select",
            valueType: "boolean",
            required: true,
            options: [
              { value: "false", label: "No" },
              { value: "true", label: "Yes" },
            ],
          },
        ]}
      />
    </div>
  );
}
