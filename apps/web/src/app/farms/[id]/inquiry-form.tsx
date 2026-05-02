"use client";

import { useMemo, useState } from "react";

export function InquiryForm(props: { farmId: string }) {
  const [botField, setBotField] = useState("");
  const [isSchool, setIsSchool] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitorMessage, setVisitorMessage] = useState("");

  const [institutionName, setInstitutionName] = useState("");
  const [studentCount, setStudentCount] = useState<string>("");
  const [ageRange, setAgeRange] = useState("");
  const [adultCount, setAdultCount] = useState<string>("");
  const [learningThemes, setLearningThemes] = useState("");
  const [preferredDates, setPreferredDates] = useState("");

  const canSubmit = useMemo(() => {
    if (!visitorName.trim()) return false;
    if (!visitorEmail.includes("@")) return false;
    if (!visitorMessage.trim()) return false;
    if (isSchool && !institutionName.trim()) return false;
    return true;
  }, [
    institutionName,
    isSchool,
    visitorEmail,
    visitorMessage,
    visitorName,
  ]);

  return (
    <div className="grid gap-3 rounded-xl border border-emerald-950/15 bg-emerald-50/40 p-5">
      <h2 className="text-lg font-semibold text-emerald-950">Send an inquiry</h2>

      <label className="grid gap-1 text-sm text-neutral-800">
        <span className="flex items-center justify-between gap-3">
          <span>School visit</span>
          <input type="checkbox" checked={isSchool} onChange={(e) => setIsSchool(e.target.checked)} />
        </span>
        <span className="text-xs text-neutral-600">
          Turn this on so AgriConnect can collect group details for teachers and coordinators.
        </span>
      </label>

      <label className="pointer-events-none absolute -left-[10000px] h-px w-px opacity-0">
        {/* Honeypot */}
        Website
        <input
          tabIndex={-1}
          autoComplete="off"
          value={botField}
          onChange={(e) => setBotField(e.target.value)}
        />
      </label>

      <label className="grid gap-1 text-sm text-neutral-800">
        Full name / organiser name
        <input
          className="rounded-md border border-neutral-300 bg-white px-3 py-2"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm text-neutral-800">
        Email
        <input
          className="rounded-md border border-neutral-300 bg-white px-3 py-2"
          inputMode="email"
          autoComplete="email"
          value={visitorEmail}
          onChange={(e) => setVisitorEmail(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm text-neutral-800">
        Phone (optional)
        <input
          className="rounded-md border border-neutral-300 bg-white px-3 py-2"
          value={visitorPhone}
          onChange={(e) => setVisitorPhone(e.target.value)}
        />
      </label>

      {isSchool && (
        <>
          <label className="grid gap-1 text-sm text-neutral-800">
            Institution name
            <input
              className="rounded-md border border-neutral-300 bg-white px-3 py-2"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-neutral-800">
            Estimated student count
            <input
              className="rounded-md border border-neutral-300 bg-white px-3 py-2"
              inputMode="numeric"
              value={studentCount}
              onChange={(e) => setStudentCount(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-neutral-800">
            Typical age range
            <input
              className="rounded-md border border-neutral-300 bg-white px-3 py-2"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-neutral-800">
            Accompanying adults
            <input
              className="rounded-md border border-neutral-300 bg-white px-3 py-2"
              inputMode="numeric"
              value={adultCount}
              onChange={(e) => setAdultCount(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-neutral-800">
            Learning themes (optional)
            <textarea
              className="min-h-[90px] rounded-md border border-neutral-300 bg-white px-3 py-2"
              value={learningThemes}
              onChange={(e) => setLearningThemes(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm text-neutral-800">
            Preferred dates / window (optional)
            <textarea
              className="min-h-[90px] rounded-md border border-neutral-300 bg-white px-3 py-2"
              value={preferredDates}
              onChange={(e) => setPreferredDates(e.target.value)}
            />
          </label>
        </>
      )}

      <label className="grid gap-1 text-sm text-neutral-800">
        Message / request
        <textarea
          className="min-h-[120px] rounded-md border border-neutral-300 bg-white px-3 py-2"
          value={visitorMessage}
          onChange={(e) => setVisitorMessage(e.target.value)}
        />
      </label>

      <button
        type="button"
        disabled={!canSubmit || busy}
        className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setMessage(null);
          try {
            const parsedStudent = Number.parseInt(studentCount, 10);
            const parsedAdults = Number.parseInt(adultCount, 10);

            const res = await fetch("/api/inquiries", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                farmId: props.farmId,
                visitorName: visitorName.trim(),
                visitorEmail: visitorEmail.trim(),
                visitorPhone: visitorPhone.trim() || null,
                visitorMessage: visitorMessage.trim(),
                isSchool,
                institutionName: isSchool ? institutionName.trim() : null,
                studentCount:
                  isSchool && studentCount.trim() && Number.isFinite(parsedStudent) ? parsedStudent : null,
                ageRange: isSchool ? ageRange.trim() : null,
                adultCount:
                  isSchool && adultCount.trim() && Number.isFinite(parsedAdults) ? parsedAdults : null,
                learningThemes: isSchool ? learningThemes.trim() : null,
                preferredDates: isSchool ? preferredDates.trim() : null,
                companyWebsite: botField.trim()?.length ? botField.trim() : null,
              }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
              setMessage((body?.error as string | undefined) || "Unable to submit.");
              return;
            }
            setMessage("Thanks — please check email for confirmation.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Submit inquiry
      </button>

      <p className="text-xs text-neutral-700">
        This is email-based coordination — there is no online payment or automated slot locking yet.
      </p>

      {message && (
        <p className="text-sm text-emerald-900" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
