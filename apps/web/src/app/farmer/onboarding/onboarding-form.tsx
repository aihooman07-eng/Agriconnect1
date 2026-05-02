"use client";

import { useMemo, useState } from "react";

export function OnboardingForm(props: {
  mode: "create" | "edit";
  farmId?: string;
  initialValues?: Partial<{
    name: string;
    shortDescription: string;
    story: string;
    latitude: number;
    longitude: number;
    dairy: boolean;
    crops: boolean;
    poultry: boolean;
    organic: boolean;
    schoolFriendly: boolean;
    primaryImageUrl: string | null;
    visitorNotes: string | null;
  }>;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState(props.initialValues?.name ?? "");
  const [shortDescription, setShortDescription] = useState(props.initialValues?.shortDescription ?? "");
  const [story, setStory] = useState(props.initialValues?.story ?? "");
  const [latitude, setLatitude] = useState(String(props.initialValues?.latitude ?? ""));
  const [longitude, setLongitude] = useState(String(props.initialValues?.longitude ?? ""));
  const [dairy, setDairy] = useState(Boolean(props.initialValues?.dairy));
  const [crops, setCrops] = useState(Boolean(props.initialValues?.crops));
  const [poultry, setPoultry] = useState(Boolean(props.initialValues?.poultry));
  const [organic, setOrganic] = useState(Boolean(props.initialValues?.organic));
  const [schoolFriendly, setSchoolFriendly] = useState(Boolean(props.initialValues?.schoolFriendly));
  const [primaryImageUrl, setPrimaryImageUrl] = useState(props.initialValues?.primaryImageUrl ?? "");
  const [visitorNotes, setVisitorNotes] = useState(props.initialValues?.visitorNotes ?? "");

  const lat = Number.parseFloat(latitude);
  const lng = Number.parseFloat(longitude);

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false;
    if (!shortDescription.trim()) return false;
    if (!story.trim()) return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    if (props.mode === "edit" && !props.farmId) return false;
    return true;
  }, [lng, lat, name, props.farmId, props.mode, shortDescription, story]);

  return (
    <div className="mx-auto grid max-w-3xl gap-4 px-4 py-10">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold text-emerald-950">
          {props.mode === "edit" ? "Edit farm listing" : "Create farm listing"}
        </h1>
        <p className="text-sm text-neutral-700">
          Keep language simple and truthful. Coordinators approve before you appear on Discover.
        </p>
      </header>

      <div className="grid gap-3 rounded-xl border border-emerald-950/15 bg-white p-6 shadow-sm">
        <label className="grid gap-1 text-sm text-neutral-900">
          Farm title
          <input className="rounded-md border border-neutral-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm text-neutral-900">
          Short description
          <input
            className="rounded-md border border-neutral-300 px-3 py-2"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm text-neutral-900">
          Full story / what visitors can expect
          <textarea className="min-h-[170px] rounded-md border border-neutral-300 px-3 py-2" value={story} onChange={(e) => setStory(e.target.value)} />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm text-neutral-900">
            Latitude (decimal degrees)
            <input className="rounded-md border border-neutral-300 px-3 py-2" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm text-neutral-900">
            Longitude (decimal degrees)
            <input className="rounded-md border border-neutral-300 px-3 py-2" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </label>
        </div>

        <div className="grid gap-2 text-sm text-neutral-900">
          <strong>Signals for visitors</strong>
          <label className="flex items-center justify-between gap-3">
            <span>Dairy</span>
            <input type="checkbox" checked={dairy} onChange={(e) => setDairy(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Crops / horticulture visits</span>
            <input type="checkbox" checked={crops} onChange={(e) => setCrops(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Poultry</span>
            <input type="checkbox" checked={poultry} onChange={(e) => setPoultry(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>Organic-led</span>
            <input type="checkbox" checked={organic} onChange={(e) => setOrganic(e.target.checked)} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span>School-friendly</span>
            <input type="checkbox" checked={schoolFriendly} onChange={(e) => setSchoolFriendly(e.target.checked)} />
          </label>
        </div>

        <label className="grid gap-1 text-sm text-neutral-900">
          Primary photo URL (optional — hosted elsewhere for now)
          <input className="rounded-md border border-neutral-300 px-3 py-2" value={primaryImageUrl} onChange={(e) => setPrimaryImageUrl(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm text-neutral-900">
          Visitor-facing notes / practical tips (optional)
          <textarea className="min-h-[90px] rounded-md border border-neutral-300 px-3 py-2" value={visitorNotes} onChange={(e) => setVisitorNotes(e.target.value)} />
        </label>

        <button
          type="button"
          disabled={!canSubmit || busy}
          className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            setMessage(null);
            try {
              const body = {
                name: name.trim(),
                shortDescription: shortDescription.trim(),
                story: story.trim(),
                latitude: lat,
                longitude: lng,
                dairy,
                crops,
                poultry,
                organic,
                schoolFriendly,
                primaryImageUrl: primaryImageUrl.trim()?.length ? primaryImageUrl.trim() : null,
                visitorNotes: visitorNotes.trim()?.length ? visitorNotes.trim() : null,
              };

              const res =
                props.mode === "create"
                  ? await fetch("/api/farms", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify(body),
                    })
                  : await fetch(`/api/farms/${props.farmId}`, {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify(body),
                    });

              if (!res.ok) {
                await res.json().catch(() => undefined);
                setMessage("Could not save — check coordinates and URLs.");
                return;
              }

              window.location.href = "/farmer/dashboard";
            } finally {
              setBusy(false);
            }
          }}
        >
          Submit for coordinator review
        </button>

        {message ? (
          <p className="text-sm text-rose-800" role="alert">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
