import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { message: "Workflow detail is not implemented yet." },
    { status: 501 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { message: "Workflow update is not implemented yet." },
    { status: 501 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Workflow deletion is not implemented yet." },
    { status: 501 }
  );
}
