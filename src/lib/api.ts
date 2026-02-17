import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(entity = "Resource") {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 });
}

export function serverError(error: unknown, fallback = "Internal server error") {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : fallback,
    },
    { status: 500 },
  );
}

export async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function parseDateOrNull(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function getTakeFromSearchParams(request: NextRequest, fallback = 25, max = 100) {
  const { searchParams } = new URL(request.url);
  const take = Number(searchParams.get("take") ?? fallback.toString());

  if (!Number.isFinite(take)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(take), 1), max);
}

export function createNumber(prefix: string) {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = `${now.getMonth() + 1}`.padStart(2, "0");
  const dd = `${now.getDate()}`.padStart(2, "0");
  const random = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${yy}${mm}${dd}-${random}`;
}
