"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type PendingFarmCard = {
  id: string;
  name: string;
  farmerEmail: string;
  latitude: number;
  longitude: number;
  dairy: boolean;
  crops: boolean;
  poultry: boolean;
  organic: boolean;
  schoolFriendly: boolean;
};

export function ModerationFarmCard(props: { farm: PendingFarmCard }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function moderate(decision: "approve" | "reject") {
    setBusy(true);
    setMessage(null);
    try {
      const trimmed = reason.trim();
      if (decision === "reject" && trimmed.length < 10) {
        setMessage("Rejection notes should explain what to fix (minimum 10 characters).");
        return;
      }

      const res = await fetch(`/api/coordinator/farms/${props.farm.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          decision === "approve"
            ? { decision: "approve" }
            : { decision: "reject", rejectionReason: trimmed },
        ),
      });

      if (!res.ok) {
        setMessage("Moderation failed — try again.");
        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="grid gap-3 rounded-xl border border-emerald-950/15 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="text-lg font-semibold text-emerald-950">{props.farm.name}</div>
          <div className="text-sm text-neutral-700">
            Farmer contact:{" "}
            <a href={`mailto:${props.farm.farmerEmail}`} className="underline">
              {props.farm.farmerEmail}
            </a>
          </div>
          <div className="text-xs text-neutral-600">
            {props.farm.latitude.toFixed(5)}, {props.farm.longitude.toFixed(5)}
          </div>
        </div>

        <div className="text-xs font-semibold text-neutral-800">
          {[
            props.farm.dairy && "dairy",
            props.farm.crops && "crops",
            props.farm.poultry && "poultry",
            props.farm.organic && "organic",
            props.farm.schoolFriendly && "school-friendly",
          ]
            .filter(Boolean)
            .join(" · ") || "general listing"}
        </div>
      </div>

      <div className="text-sm">
        <Link href={`/farms/${props.farm.id}`} className="font-semibold text-emerald-900 underline">
          Preview full farmer-submitted listing
        </Link>
      </div>

      <label className="grid gap-1 text-sm text-neutral-900">
        Rejection reason (required only for Return for edits)
        <textarea className="min-h-[96px] rounded-md border border-neutral-300 px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => void moderate("approve")}
        >
          Approve → go live
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-md border border-rose-800 px-3 py-2 text-sm font-semibold text-rose-900 disabled:opacity-50"
          onClick={() => void moderate("reject")}
        >
          Return for edits (email farmer)
        </button>
      </div>

      {message ? (
        <p className="text-sm text-rose-800" role="alert">
          {message}
        </p>
      ) : null}
    </li>
  );
}
