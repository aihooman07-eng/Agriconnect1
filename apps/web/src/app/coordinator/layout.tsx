import { redirect } from "next/navigation";
import { requireCoordinator } from "@/lib/auth";

export default async function CoordinatorPortalLayout(props: Readonly<{ children: React.ReactNode }>) {
  const ok = await requireCoordinator();
  if (!ok) {
    redirect("/auth/login");
  }

  return <div>{props.children}</div>;
}
