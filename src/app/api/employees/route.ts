import { EmployeeRole, EmployeeStatus, UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoleFromRequest } from "@/lib/auth";
import { employeeInputSchema } from "@/lib/validators";
import {
  badRequest,
  getTakeFromSearchParams,
  readJsonBody,
  serverError,
  unauthorized,
} from "@/lib/api";

const statuses = new Set(Object.values(EmployeeStatus));
const roles = new Set(Object.values(EmployeeRole));

export async function GET(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const roleParam = searchParams.get("role");
  const take = getTakeFromSearchParams(request, 40, 100);

  const where: {
    status?: EmployeeStatus;
    role?: EmployeeRole;
  } = {};

  if (statusParam && statuses.has(statusParam as EmployeeStatus)) {
    where.status = statusParam as EmployeeStatus;
  }

  if (roleParam && roles.has(roleParam as EmployeeRole)) {
    where.role = roleParam as EmployeeRole;
  }

  try {
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          _count: {
            select: {
              workOrders: true,
              scheduleItems: true,
            },
          },
        },
        orderBy: [{ fullName: "asc" }],
        take,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({ data: employees, count: employees.length, total });
  } catch (error) {
    return serverError(error, "Failed to fetch employees");
  }
}

export async function POST(request: NextRequest) {
  const user = await requireRoleFromRequest(request, [UserRole.ADMIN, UserRole.MANAGER]);

  if (!user) {
    return unauthorized();
  }

  const body = await readJsonBody(request);

  if (!body) {
    return badRequest("Invalid JSON payload");
  }

  const parsed = employeeInputSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest("Validation failed", parsed.error.flatten());
  }

  try {
    const employee = await prisma.employee.create({
      data: {
        ...parsed.data,
        territory: parsed.data.territory ?? null,
        avatarUrl: parsed.data.avatarUrl ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        actorName: user.fullName ?? user.username,
        action: "Added employee",
        entityType: "Employee",
        entityId: employee.id,
        description: `Added employee ${employee.fullName} (${employee.role}).`,
        severity: "SUCCESS",
        userId: user.id,
      },
    });

    return NextResponse.json({ message: "Employee created", data: employee }, { status: 201 });
  } catch (error) {
    return serverError(error, "Failed to create employee");
  }
}
