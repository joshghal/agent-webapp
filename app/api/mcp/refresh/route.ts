import { NextResponse } from "next/server";
import { getMcpServersCached } from "@/lib/server/mcp";

export async function POST() {
  return NextResponse.json(await getMcpServersCached(true));
}
