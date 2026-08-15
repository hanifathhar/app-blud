import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL;
    // Test database connection using Prisma instead of pg
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    return NextResponse.json({
      success: true,
      dbUrl: dbUrl ? dbUrl.split('@')[1]?.split('/')[0] : 'hidden',
      time: result
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}
