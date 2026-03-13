import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "AI workflow generation is not implemented yet." },
    { status: 501 }
  );
}
