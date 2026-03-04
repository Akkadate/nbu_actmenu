"use client";

import { useEffect, useMemo, useState } from "react";

function normalizeLiffId(value: string | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const url = new URL(trimmed);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] ?? "";
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

function resolveActivity(): string {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const directActivity = params.get("activity") ?? "";
  if (directActivity) return directActivity;

  const liffState = params.get("liff.state") ?? "";
  if (liffState) {
    try {
      const decoded = decodeURIComponent(liffState);
      const stateUrl = decoded.startsWith("http")
        ? new URL(decoded)
        : new URL(decoded, window.location.origin);
      const activityFromState = stateUrl.searchParams.get("activity") ?? "";
      if (activityFromState) return activityFromState;
    } catch {
      // ignore parse error and use fallback below
    }
  }

  const fromSession = sessionStorage.getItem("activity_key") ?? "";
  if (fromSession) return fromSession;

  return localStorage.getItem("activity_key") ?? "";
}

export default function OpenLiffPage() {
  const liffId = useMemo(() => normalizeLiffId(process.env.NEXT_PUBLIC_LIFF_ID), []);
  const lineOaUrl = process.env.NEXT_PUBLIC_LINE_OA_URL ?? "";
  const [activity, setActivity] = useState("");
  const [activityResolved, setActivityResolved] = useState(false);

  useEffect(() => {
    const resolved = resolveActivity();
    if (resolved) {
      setActivity(resolved);
      sessionStorage.setItem("activity_key", resolved);
      localStorage.setItem("activity_key", resolved);
    }
    setActivityResolved(true);
  }, []);

  const deepLink = useMemo(() => {
    if (!liffId) return "";
    const qs = activity ? `?activity=${encodeURIComponent(activity)}` : "";
    return `line://app/${liffId}${qs}`;
  }, [activity, liffId]);

  const fallbackLiffUrl = useMemo(() => {
    if (!liffId) return "";
    const url = new URL(`https://liff.line.me/${liffId}`);
    if (activity) {
      url.searchParams.set("activity", activity);
    }
    // Prevent loop: this param tells /liff not to re-open bridge again.
    url.searchParams.set("lineapp", "0");
    return url.toString();
  }, [activity, liffId]);

  useEffect(() => {
    if (!activityResolved || !activity || !deepLink || !fallbackLiffUrl) return;

    const timer = window.setTimeout(() => {
      window.location.replace(fallbackLiffUrl);
    }, 1200);

    window.location.href = deepLink;

    return () => {
      window.clearTimeout(timer);
    };
  }, [activity, activityResolved, deepLink, fallbackLiffUrl]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Opening LINE app...</h1>
        <p className="mt-2 text-sm text-slate-600">
          If LINE app does not open automatically, use one of the buttons below.
        </p>

        <div className="mt-5 space-y-3">
          <a
            href={deepLink || "#"}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            aria-disabled={!activity}
          >
            Open in LINE App
          </a>
          <a
            href={fallbackLiffUrl || "#"}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            aria-disabled={!activity}
          >
            Continue on Web
          </a>
          {!activity ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Missing activity key. Please reopen from the original activity link.
            </p>
          ) : null}
          {lineOaUrl ? (
            <a
              href={lineOaUrl}
              className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Open LINE OA
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}
