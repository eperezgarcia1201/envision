import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const takeParam = Number(searchParams.get("take") ?? "30");
  const take = Number.isFinite(takeParam) ? Math.min(Math.max(takeParam, 1), 100) : 30;

  const where = category
    ? {
        category,
      }
    : undefined;

  const gallery = await prisma.galleryAsset.findMany({
    where,
    orderBy: [{ capturedAt: "desc" }],
    take,
  });

  return NextResponse.json({ data: gallery, count: gallery.length });
}
