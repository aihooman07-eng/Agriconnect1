import { redirect } from "next/navigation";

export default async function FarmerIndex() {
  redirect("/farmer/dashboard");
}
