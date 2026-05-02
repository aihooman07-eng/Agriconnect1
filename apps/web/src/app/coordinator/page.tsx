import { redirect } from "next/navigation";

export default async function CoordinatorIndex() {
  redirect("/coordinator/queue");
}
