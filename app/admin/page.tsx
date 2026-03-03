"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Activity = {
  activity_key: string;
  activity_name: string;
  richmenu_id: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

type ActivitiesResponse = {
  success: boolean;
  items?: Activity[];
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function AdminPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/admin/activities", { cache: "no-store" });
        const data = (await res.json()) as ActivitiesResponse;

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load activities");
        }

        setItems(data.items ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Activities</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/manual"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              คู่มือการใช้งาน
            </Link>
            <Link
              href="/admin/activity"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Create New
            </Link>
          </div>
        </div>

        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-4 py-3">Activity Key</th>
                <th className="px-4 py-3">Activity Name</th>
                <th className="px-4 py-3">Rich Menu ID</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Date Range</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-4" colSpan={6}>
                    No activities found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.activity_key} className="border-t border-slate-200">
                    <td className="px-4 py-3 font-mono">{item.activity_key}</td>
                    <td className="px-4 py-3">{item.activity_name}</td>
                    <td className="px-4 py-3 font-mono">{item.richmenu_id}</td>
                    <td className="px-4 py-3">{item.is_active ? "Yes" : "No"}</td>
                    <td className="px-4 py-3">
                      {formatDate(item.start_date)} - {formatDate(item.end_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/activity/${encodeURIComponent(item.activity_key)}/edit`}
                        className="text-slate-700 underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
