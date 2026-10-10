import { scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { backend } from "./backend";
export const COOKIE = "mongoose_admin";
export function checkPassword(password: string) {
  const [version, salt, hash] = (process.env.ADMIN_PASSWORD_HASH || "").split(
    ":",
  );
  if (version !== "scrypt" || !salt || !hash || hash.length !== 128)
    return false;
  const actual = scryptSync(password, salt, 64),
    expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function session() {
  const value = (await cookies()).get(COOKIE)?.value || "";
  if (!/^[a-f0-9]{64}$/.test(value)) return "";
  const res = await backend("session", "GET", undefined, "", value);
  return res.ok ? value : "";
}
export function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configured = process.env.DASHBOARD_URL;
  return (
    !!origin &&
    origin === new URL(configured || request.url).origin &&
    request.headers.get("x-requested-with") === "fetch"
  );
}
export async function readBody(request: Request, limit: number) {
  if (Number(request.headers.get("content-length")) > limit)
    throw new Error("The request is too large.");
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > limit) {
        await reader.cancel();
        throw new Error("The request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
