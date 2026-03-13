import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "Manual workflow execution is not implemented yet." },
    { status: 501 }
  );
}
