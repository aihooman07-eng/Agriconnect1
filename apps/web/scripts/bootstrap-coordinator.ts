import "dotenv/config";
import { eq } from "drizzle-orm";
import { coordinators } from "../drizzle/schema";
import { getDb } from "../src/lib/db";

async function main() {
  const email = process.env.COORDINATOR_BOOTSTRAP_EMAIL?.trim()?.toLowerCase();
  if (!email) {
    throw new Error("COORDINATOR_BOOTSTRAP_EMAIL is not set in the environment.");
  }

  const db = getDb();
  const existing = await db
    .select({ id: coordinators.id })
    .from(coordinators)
    .where(eq(coordinators.email, email))
    .limit(1);

  if (existing.length) {
    console.log(`Coordinator already exists for ${email}`);
    return;
  }

  await db.insert(coordinators).values({ email });
  console.log(`Created coordinator row for ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
