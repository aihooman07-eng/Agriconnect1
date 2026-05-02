import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-16">
      <section className="grid gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-900/80">
          Malkangiri · Guided discovery · Hosted by communities
        </p>
        <h1 className="text-balance text-4xl font-semibold text-emerald-950 md:text-5xl">
          AgriConnect helps visitors find trusted farm stays and learning visits grounded in stewardship.
        </h1>
        <p className="max-w-3xl text-pretty text-lg text-neutral-800">
          Coordinators approve every listing before it appears on Discover. Inquiry flows stay email-forward for farmers
          and guests — respectful to small farmers, clear for urban families and schools planning responsible trips.
        </p>
      </section>

      <section className="grid gap-4 rounded-3xl border border-emerald-950/10 bg-emerald-50/60 p-8">
        <h2 className="text-2xl font-semibold text-emerald-950">How AgriConnect works</h2>
        <ol className="grid gap-3 text-sm text-neutral-900 md:grid-cols-3">
          <li className="rounded-2xl bg-white/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-950/70">Guests</div>
            <div className="mt-2 font-semibold text-emerald-950">Browse & enquire</div>
            <div className="mt-2 text-neutral-700">Use Discover with filters tuned for schools and families.</div>
          </li>
          <li className="rounded-2xl bg-white/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-950/70">Farmers</div>
            <div className="mt-2 font-semibold text-emerald-950">List with Email OTP</div>
            <div className="mt-2 text-neutral-700">Tell your farm story plainly; coordinators help with quality gates.</div>
          </li>
          <li className="rounded-2xl bg-white/70 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-950/70">Coordinators</div>
            <div className="mt-2 font-semibold text-emerald-950">Approve or gently return drafts</div>
            <div className="mt-2 text-neutral-700">Notes go straight to the farmer inbox as email-backed feedback.</div>
          </li>
        </ol>
      </section>

      <section className="flex flex-wrap gap-4">
        <Link
          href="/discover"
          className="inline-flex rounded-full bg-emerald-900 px-6 py-3 text-sm font-semibold text-emerald-50"
        >
          Open Discover map
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex rounded-full border border-emerald-900/60 px-6 py-3 text-sm font-semibold text-emerald-950"
        >
          Farmer / Coordinator sign-in
        </Link>
      </section>
    </div>
  );
}
