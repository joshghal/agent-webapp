import { NextResponse } from "next/server";
import { getMcpServersCached } from "@/lib/server/mcp";

export async function GET() {
  return NextResponse.json(await getMcpServersCached());
}
