import { NextResponse } from "next/server";
import { getAuthStatus } from "@/lib/server/authStatus";

export async function GET() {
  return NextResponse.json(getAuthStatus());
}
