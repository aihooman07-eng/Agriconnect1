import { redirect } from "next/navigation";
import { requireFarmer } from "@/lib/auth";

export default async function FarmerPortalLayout(props: Readonly<{ children: React.ReactNode }>) {
  const ok = await requireFarmer();
  if (!ok) {
    redirect("/auth/login");
  }

  return <div>{props.children}</div>;
}
