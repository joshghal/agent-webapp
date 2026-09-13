import { config } from "dotenv";
import { join } from "node:path";

config({ path: join(process.cwd(), ".env") });

export const PORT = Number(process.env.PORT || 8788);
export const AUTH_USER = process.env.AUTH_USER || "joshua";
export const AUTH_PASS = process.env.AUTH_PASS;
export const HOME = process.env.HOME as string;
export const DEFAULT_PROJECT_DIR = process.env.PROJECT_DIR || HOME;

if (!AUTH_PASS) {
  console.error("AUTH_PASS not set in .env — refusing to start unprotected.");
  process.exit(1);
}
