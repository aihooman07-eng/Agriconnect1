"use client";

import { useMemo, useState } from "react";

export function LoginEmailOtp() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSend = useMemo(() => email.includes("@"), [email]);

  return (
    <div className="mx-auto grid max-w-md gap-4 rounded-xl border border-emerald-900/10 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-emerald-950">Sign in with email OTP</h1>
      <p className="text-sm text-neutral-700">
        Farmers and coordinators use the same OTP flow — your role depends on accounts created by AgriConnect
        coordinators.
      </p>

      {step === "email" ? (
        <>
          <label className="grid gap-1 text-sm text-neutral-800">
            Email
            <input
              className="rounded-md border border-neutral-300 px-3 py-2"
              autoComplete="email"
              inputMode="email"
              placeholder="farmername@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={!canSend || busy}
            className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              setMessage(null);
              try {
                const res = await fetch("/api/auth/send-otp", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ email: email.trim().toLowerCase() }),
                });
                if (!res.ok) {
                  setMessage(`Could not send code (${res.status}).`);
                  setBusy(false);
                  return;
                }
                setStep("code");
              } finally {
                setBusy(false);
              }
            }}
          >
            Send code
          </button>
        </>
      ) : (
        <>
          <label className="grid gap-1 text-sm text-neutral-800">
            6-digit code
            <input
              className="rounded-md border border-neutral-300 px-3 py-2"
              inputMode="numeric"
              pattern="\\d{6}"
              placeholder="●●●●●●"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
            />
          </label>
          <button
            type="button"
            disabled={!/^[0-9]{6}$/.test(code) || busy}
            className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              setMessage(null);
              try {
                const res = await fetch("/api/auth/verify-otp", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    code,
                  }),
                });
                const body = await res.json().catch(() => ({}));

                if (!res.ok || !body.ok) {
                  setMessage("Invalid code or session error.");
                  setBusy(false);
                  return;
                }

                window.location.href =
                  body.role === "coordinator" ? "/coordinator/queue" : "/farmer/dashboard";
              } finally {
                setBusy(false);
              }
            }}
          >
            Continue
          </button>
          <button
            type="button"
            className="text-sm text-neutral-700 underline"
            disabled={busy}
            onClick={() => {
              setStep("email");
              setCode("");
              setMessage(null);
            }}
          >
            Use a different email
          </button>
        </>
      )}

      {message && (
        <p className="text-sm text-red-700" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
