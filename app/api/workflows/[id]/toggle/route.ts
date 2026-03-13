import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    { message: "Workflow toggle is not implemented yet." },
    { status: 501 }
  );
}
