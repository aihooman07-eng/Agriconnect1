"use client";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="rounded-md border border-emerald-700/70 bg-emerald-900 px-3 py-1 text-sm hover:bg-emerald-800"
      onClick={async () => {
        await fetch("/api/auth/sign-out", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Sign out
    </button>
  );
}
