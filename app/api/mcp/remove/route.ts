import { NextResponse } from "next/server";
import { removeMcpServer, getMcpServersCached } from "@/lib/server/mcp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await removeMcpServer(body.name);
    return NextResponse.json(await getMcpServersCached(true));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
