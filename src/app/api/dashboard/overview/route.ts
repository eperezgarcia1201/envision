import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCrmDashboardData } from "@/lib/crm";

export async function GET() {
  const user = await getCurrentUser();

  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getCrmDashboardData();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load dashboard overview",
      },
      { status: 500 },
    );
  }
}
