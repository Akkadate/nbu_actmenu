"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Activity = {
  activity_key: string;
  activity_name: string;
  richmenu_id: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  flex_payload?: unknown;
};

type ActivitiesResponse = {
  success: boolean;
  items?: Activity[];
  error?: string;
};

type ApiResponse = {
  success: boolean;
  error?: string;
};

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function EditActivityPage() {
  const params = useParams<{ activity_key: string }>();
  const router = useRouter();
  const activityKey = useMemo(() => decodeURIComponent(params.activity_key), [params.activity_key]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activityName, setActivityName] = useState("");
  const [richmenuId, setRichmenuId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [flexPayloadText, setFlexPayloadText] = useState("{}\n");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const res = await fetch("/api/admin/activities", { cache: "no-store" });
        const data = (await res.json()) as ActivitiesResponse;

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load activity");
        }

        const item = (data.items ?? []).find((x) => x.activity_key === activityKey);
        if (!item) {
          throw new Error("Activity not found");
        }

        setActivityName(item.activity_name ?? "");
        setRichmenuId(item.richmenu_id ?? "");
        setIsActive(Boolean(item.is_active));
        setStartDate(toDatetimeLocal(item.start_date));
        setEndDate(toDatetimeLocal(item.end_date));
        setFlexPayloadText(`${JSON.stringify(item.flex_payload ?? {}, null, 2)}\n`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [activityKey]);

  const onSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    let flexPayload: unknown;
    try {
      flexPayload = JSON.parse(flexPayloadText);
    } catch {
      setSaving(false);
      setError("flex_payload must be valid JSON");
      return;
    }

    if (typeof flexPayload !== "object" || flexPayload === null || Array.isArray(flexPayload)) {
      setSaving(false);
      setError("flex_payload must be a JSON object");
      return;
    }

    try {
      const res = await fetch(`/api/admin/activities/${encodeURIComponent(activityKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_name: activityName,
          richmenu_id: richmenuId,
          start_date: startDate ? startDate : null,
          end_date: endDate ? endDate : null,
          is_active: isActive,
          flex_payload: flexPayload,
        }),
      });

      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update activity");
      }

      setSuccess("Activity updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  const onDisable = async () => {
    setDisabling(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/activities/${encodeURIComponent(activityKey)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to disable activity");
      }

      setIsActive(false);
      setSuccess("Activity disabled.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setDisabling(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-lg border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Edit Activity</h1>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => router.push("/admin")}
          >
            Back to /admin
          </button>
        </div>

        <p className="text-sm text-slate-600">Activity Key: {activityKey}</p>

        {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        {loading ? (
          <p className="mt-6 text-sm">Loading...</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSave}>
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
                  Start Date
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
                  End Date
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

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>

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

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={onDisable}
                disabled={disabling}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {disabling ? "Disabling..." : "Disable"}
              </button>
              <Link href="/admin" className="rounded-md px-4 py-2 text-sm underline">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}