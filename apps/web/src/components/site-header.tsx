import Link from "next/link";
import { getSessionPrincipal } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await getSessionPrincipal();

  return (
    <header className="border-b border-emerald-900/15 bg-emerald-950 text-emerald-50">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          AgriConnect
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link className="hover:underline" href="/discover">
            Discover farms
          </Link>
          {session?.kind === "farmer" && (
            <>
              <Link className="hover:underline" href="/farmer/dashboard">
                Farmer portal
              </Link>
              <Link className="hover:underline" href="/farmer/onboarding">
                Add / edit listing
              </Link>
            </>
          )}
          {session?.kind === "coordinator" && (
            <Link className="hover:underline" href="/coordinator/queue">
              Moderation queue
            </Link>
          )}
          {!session && (
            <Link className="hover:underline" href="/auth/login">
              Sign in
            </Link>
          )}
          {session && (
            <>
              <span className="hidden text-emerald-200 sm:inline">{session.email}</span>
              <SignOutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
