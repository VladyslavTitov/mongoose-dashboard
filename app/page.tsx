import { redirect } from "next/navigation";
import { session } from "@/lib/auth";
import Dashboard from "./Dashboard";
export const dynamic = "force-dynamic";
export default async function Page() {
  let token = "";
  try {
    token = await session();
  } catch {}
  if (!token) redirect("/login");
  return <Dashboard publicUrl={process.env.PUBLIC_SITE_URL || ""} />;
}
