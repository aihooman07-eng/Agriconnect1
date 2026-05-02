import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { farms } from "@schema";
import { requireFarmer } from "@/lib/auth";
import { tryGetDb } from "@/lib/db";
import { OnboardingForm } from "./onboarding-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FarmerOnboardingPage(props: {
  searchParams?: SearchParams;
}) {
  const farmer = await requireFarmer();
  if (!farmer) {
    redirect("/auth/login");
  }

  const sp = props.searchParams ? await props.searchParams : {};
  const editRaw = sp.edit;
  const editId =
    typeof editRaw === "string" ? editRaw : Array.isArray(editRaw) ? editRaw[0] : undefined;

  if (!editId) {
    return <OnboardingForm mode="create" />;
  }

  const db = tryGetDb();
  if (!db) {
    redirect("/farmer/dashboard");
  }

  const [row] = await db
    .select()
    .from(farms)
    .where(and(eq(farms.id, editId), eq(farms.farmerId, farmer.farmerId)))
    .limit(1);

  if (!row) {
    redirect("/farmer/dashboard");
  }

  return (
    <OnboardingForm
      mode="edit"
      farmId={row.id}
      initialValues={{
        name: row.name,
        shortDescription: row.shortDescription,
        story: row.story,
        latitude: row.latitude,
        longitude: row.longitude,
        dairy: row.dairy,
        crops: row.crops,
        poultry: row.poultry,
        organic: row.organic,
        schoolFriendly: row.schoolFriendly,
        primaryImageUrl: row.primaryImageUrl ?? null,
        visitorNotes: row.visitorNotes ?? null,
      }}
    />
  );
}
