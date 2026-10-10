import { cookies } from "next/headers";
import { backend } from "@/lib/backend";
import { allowedOrigin, COOKIE, readBody } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (request.method !== "GET" && !allowedOrigin(request))
    return Response.json(
      { message: "Request origin was rejected." },
      { status: 403 },
    );
  const { path } = await params;
  if (
    ![
      "reviews",
      "review-images",
      "requests",
      "attachments",
      "images",
      "folder-images",
      "portfolio",
      "settings",
    ].includes(path[0]) ||
    path.length > 2 ||
    path.some((p) => !/^[-a-zA-Z0-9]+$/.test(p))
  )
    return Response.json({ message: "Not found." }, { status: 404 });
  const token = (await cookies()).get(COOKIE)?.value || "";
  if (!/^[a-f0-9]{64}$/.test(token))
    return Response.json({ message: "Please sign in." }, { status: 401 });
  try {
    const bytes =
      request.method === "GET" ? undefined : await readBody(request, 4_000_000);
    const response = await backend(
      path.join("/"),
      request.method,
      bytes,
      request.headers.get("content-type") || "",
      token,
    );
    const headers = new Headers({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    for (const h of ["content-type", "content-disposition"])
      if (response.headers.has(h)) headers.set(h, response.headers.get(h)!);
    if (path[0] === "attachments")
      headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return Response.json(
      { message: "Connection failed. Please try again." },
      { status: 503 },
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
