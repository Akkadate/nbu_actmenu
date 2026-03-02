"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ApiResponse = {
  success: boolean;
  error?: string;
};

export default function CreateActivityPage() {
  const [activityKey, setActivityKey] = useState("");
  const [activityName, setActivityName] = useState("");
  const [richmenuId, setRichmenuId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [flexPayloadText, setFlexPayloadText] = useState("{}\n");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    let flexPayload: unknown;

    try {
      flexPayload = JSON.parse(flexPayloadText);
    } catch {
      setSubmitting(false);
      setError("flex_payload must be valid JSON");
      return;
    }

    if (typeof flexPayload !== "object" || flexPayload === null || Array.isArray(flexPayload)) {
      setSubmitting(false);
      setError("flex_payload must be a JSON object");
      return;
    }

    try {
      const response = await fetch("/api/admin/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_key: activityKey,
          activity_name: activityName,
          richmenu_id: richmenuId,
          flex_payload: flexPayload,
          start_date: startDate ? startDate : null,
          end_date: endDate ? endDate : null,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create activity");
      }

      setSuccess("Activity created successfully.");
      setActivityKey("");
      setActivityName("");
      setRichmenuId("");
      setStartDate("");
      setEndDate("");
      setFlexPayloadText("{}\n");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Create Activity</h1>

        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        {success ? (
          <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <p>{success}</p>
            <Link href="/admin" className="mt-2 inline-block underline">
              Back to /admin
            </Link>
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="activity_key">
              Activity Key
            </label>
            <input
              id="activity_key"
              type="text"
              value={activityKey}
              onChange={(e) => setActivityKey(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="activity_name">
              Activity Name
            </label>
            <input
              id="activity_name"
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="richmenu_id">
              Rich Menu ID
            </label>
            <input
              id="richmenu_id"
              type="text"
              value={richmenuId}
              onChange={(e) => setRichmenuId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="start_date">
                Start Date (optional)
              </label>
              <input
                id="start_date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="end_date">
                End Date (optional)
              </label>
              <input
                id="end_date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="flex_payload">
              flex_payload (JSON object)
            </label>
            <textarea
              id="flex_payload"
              value={flexPayloadText}
              onChange={(e) => setFlexPayloadText(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Create Activity"}
          </button>
        </form>
      </div>
    </main>
  );
}