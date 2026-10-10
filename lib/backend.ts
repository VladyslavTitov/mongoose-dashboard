import { createHash, createHmac, randomUUID } from "node:crypto";
export async function backend(
  path: string,
  method = "GET",
  body?: Buffer,
  contentType = "",
  session = "",
) {
  const configured = process.env.PUBLIC_SITE_URL,
    key = process.env.DASHBOARD_PAIRING_KEY;
  if (!configured || !key || key.length < 32)
    throw new Error("Dashboard connection is not configured.");
  const base = new URL(configured);
  if (process.env.NODE_ENV === "production" && base.protocol !== "https:")
    throw new Error("HTTPS is required.");
  const url = new URL(`/api/admin/${path}`, base);
  const timestamp = String(Date.now()),
    nonce = randomUUID(),
    bytes = body || Buffer.alloc(0);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const signature = createHmac("sha256", key)
    .update(
      [method, url.pathname, hash, timestamp, nonce, contentType, session].join(
        "\n",
      ),
    )
    .digest("hex");
  return fetch(url, {
    method,
    headers: {
      "x-pair-timestamp": timestamp,
      "x-pair-nonce": nonce,
      "x-pair-signature": signature,
      "x-admin-session": session,
      ...(contentType ? { "content-type": contentType } : {}),
    },
    body: body ? new Uint8Array(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
    redirect: "error",
  });
}
export async function backendJson(
  path: string,
  method = "GET",
  body?: unknown,
  session = "",
) {
  const response = await backend(
    path,
    method,
    body === undefined ? undefined : Buffer.from(JSON.stringify(body)),
    body === undefined ? "" : "application/json",
    session,
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.message || "The website connection failed.");
  return result;
}
