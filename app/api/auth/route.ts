import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { allowedOrigin, checkPassword, COOKIE, readBody } from "@/lib/auth";
import { backendJson } from "@/lib/backend";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!allowedOrigin(request))
    return Response.json(
      { message: "Request origin was rejected." },
      { status: 403 },
    );
  try {
    let data;
    try {
      data = JSON.parse((await readBody(request, 2000)).toString());
    } catch {
      return Response.json({ message: "Invalid request." }, { status: 400 });
    }
    if (typeof data?.password !== "string" || data.password.length > 200)
      return Response.json({ message: "Invalid password." }, { status: 400 });
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    await backendJson("login-limit", "POST", { ip });
    if (!checkPassword(data.password))
      return Response.json({ message: "Incorrect password." }, { status: 401 });
    const token = randomBytes(32).toString("hex");
    await backendJson("sessions", "POST", { token });
    (await cookies()).set(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 3600,
    });
    return Response.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      {
        message:
          "Sign-in is temporarily unavailable or too many attempts were made. Please try later.",
      },
      { status: 503 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!allowedOrigin(request))
    return Response.json(
      { message: "Request origin was rejected." },
      { status: 403 },
    );
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value || "";
  try {
    await backendJson("sessions", "DELETE", undefined, token);
    jar.delete(COOKIE);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { message: "Sign-out could not be completed. Please try again." },
      { status: 503 },
    );
  }
}
