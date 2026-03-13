import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Cron runner is not implemented yet." },
    { status: 501 }
  );
}
