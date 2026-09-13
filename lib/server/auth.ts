import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { AUTH_USER, AUTH_PASS } from "./env";

// Constant-time comparison — a plain === on the password would leak how many
// leading bytes matched via response timing, letting an attacker brute-force it
// byte by byte. Buffers are padded to equal length first since timingSafeEqual
// throws (rather than just returning false) on a length mismatch.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, Buffer.alloc(bufA.length)); // keep timing consistent either way
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export function checkAuth(req: IncomingMessage): boolean {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  return safeEqual(user, AUTH_USER) && safeEqual(pass, AUTH_PASS as string);
}
