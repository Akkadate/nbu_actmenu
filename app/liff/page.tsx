"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type VerifyResponse = {
  success: boolean;
  verified?: boolean;
  student_id?: string;
  student_name?: string;
  error?: string;
};

type EnterActivityResponse = {
  success: boolean;
  error?: string;
  activity_name?: string;
};

type ActivitiesResponse = {
  success: boolean;
  items?: Array<{
    activity_key: string;
    activity_name: string;
  }>;
};

type UiStage = "loading" | "verify" | "summary" | "redirecting";

declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: (options?: { redirectUri?: string }) => void;
      isInClient: () => boolean;
      getFriendship: () => Promise<{ friendFlag: boolean }>;
      getProfile: () => Promise<{ userId: string }>;
    };
  }
}

const LIFF_SCRIPT_SRC = "https://static.line-scdn.net/liff/edge/2/sdk.js";

function loadLiffScript(): Promise<void> {
  if (window.liff) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src=\"${LIFF_SCRIPT_SRC}\"]`) as
      | HTMLScriptElement
      | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load LIFF SDK")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = LIFF_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load LIFF SDK"));
    document.body.appendChild(script);
  });
}

function LiffPageContent() {
  const searchParams = useSearchParams();
  const activityParam = useMemo(() => searchParams.get("activity") ?? "", [searchParams]);
  const liffStateParam = useMemo(() => searchParams.get("liff.state") ?? "", [searchParams]);

  const [activity, setActivity] = useState("");
  const [activityName, setActivityName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [userId, setUserId] = useState("");

  const [stage, setStage] = useState<UiStage>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [studentId, setStudentId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const lineOaId = process.env.NEXT_PUBLIC_LINE_OA_ID ?? "";
  const lineOaUrl = process.env.NEXT_PUBLIC_LINE_OA_URL ?? "";

  const isInLineClient = () => {
    const byLiff = window.liff?.isInClient?.() ?? false;
    const byUa = /Line\//i.test(window.navigator.userAgent);
    return byLiff || byUa;
  };

  const openLineOaChat = () => {
    if (!lineOaUrl) {
      setErrorMessage("Missing NEXT_PUBLIC_LINE_OA_URL");
      return;
    }
    window.location.replace(lineOaUrl);
  };

  const getFriendFlag = async () => {
    if (!window.liff?.getFriendship) return false;
    try {
      const result = await window.liff.getFriendship();
      return Boolean(result.friendFlag);
    } catch {
      return false;
    }
  };

  const enterActivity = async (lineUserId: string) => {
    const response = await fetch("/api/enter-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        line_user_id: lineUserId,
        activity_key: activity,
      }),
    });

    const data = (await response.json()) as EnterActivityResponse;

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to enter activity");
    }

    if (data.activity_name) {
      setActivityName(data.activity_name);
    }
  };

  const loadActivityName = async (activityKey: string) => {
    try {
      const res = await fetch("/api/admin/activities", { cache: "no-store" });
      const data = (await res.json()) as ActivitiesResponse;
      if (!res.ok || !data.success) return;
      const found = (data.items ?? []).find((item) => item.activity_key === activityKey);
      if (found?.activity_name) {
        setActivityName(found.activity_name);
      }
    } catch {
      // keep fallback to activity key
    }
  };

  const proceedAfterVerified = async (lineUserId: string, name: string) => {
    setStudentName(name || "-");

    const friendFlag = await getFriendFlag();
    const inLine = isInLineClient();

    if (friendFlag) {
      await enterActivity(lineUserId);
      setStatusMessage("Check-in completed successfully.");

      if (inLine) {
        setStage("redirecting");
        setTimeout(() => openLineOaChat(), 200);
        return;
      }

      setStage("summary");
      return;
    }

    if (inLine) {
      setStatusMessage("Please add LINE OA friend to continue.");
      setStage("redirecting");
      setTimeout(() => openLineOaChat(), 200);
      return;
    }

    setStatusMessage("Login successful. Please open LINE OA chat to continue.");
    setStage("summary");
  };

  useEffect(() => {
    if (activityParam) {
      setActivity(activityParam);
      sessionStorage.setItem("activity_key", activityParam);
      return;
    }

    if (liffStateParam) {
      try {
        const decoded = decodeURIComponent(liffStateParam);
        const stateUrl = decoded.startsWith("http")
          ? new URL(decoded)
          : new URL(decoded, window.location.origin);
        const stateActivity = stateUrl.searchParams.get("activity") ?? "";
        if (stateActivity) {
          setActivity(stateActivity);
          sessionStorage.setItem("activity_key", stateActivity);
          return;
        }
      } catch {
        // fallback below
      }
    }

    setActivity(sessionStorage.getItem("activity_key") ?? "");
  }, [activityParam, liffStateParam]);

  useEffect(() => {
    const run = async () => {
      setErrorMessage("");
      setStatusMessage("");
      setStage("loading");

      try {
        if (!activity) {
          setErrorMessage("Missing activity key");
          setStage("summary");
          return;
        }

        await loadActivityName(activity);

        if (!liffId) {
          throw new Error("Missing NEXT_PUBLIC_LIFF_ID");
        }

        await loadLiffScript();
        if (!window.liff) {
          throw new Error("LIFF SDK unavailable");
        }

        await window.liff.init({ liffId });

        if (!window.liff.isLoggedIn()) {
          const redirectUri = new URL(window.location.href);
          if (!redirectUri.searchParams.get("activity")) {
            redirectUri.searchParams.set("activity", activity);
          }
          window.liff.login({ redirectUri: redirectUri.toString() });
          return;
        }

        const profile = await window.liff.getProfile();
        setUserId(profile.userId);

        const verificationRes = await fetch(
          `/api/check-verification?line_user_id=${encodeURIComponent(profile.userId)}`
        );
        const verificationData = (await verificationRes.json()) as VerifyResponse;

        if (!verificationRes.ok || !verificationData.success) {
          throw new Error(verificationData.error || "Failed to check verification");
        }

        if (!verificationData.verified) {
          setStage("verify");
          return;
        }

        await proceedAfterVerified(
          profile.userId,
          verificationData.student_name ?? verificationData.student_id ?? "-"
        );
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unexpected error");
        setStage("summary");
      }
    };

    void run();
  }, [activity, liffId]);

  const onVerifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      if (!userId) {
        throw new Error("Missing LINE user profile");
      }

      const verifyRes = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_user_id: userId,
          student_id: studentId,
          date_of_birth: dateOfBirth,
          id_number: idNumber,
        }),
      });

      const verifyData = (await verifyRes.json()) as VerifyResponse;
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Verification failed");
      }

      if (!verifyData.verified) {
        setStatusMessage("Verification failed. Please check your information.");
        return;
      }

      await proceedAfterVerified(userId, verifyData.student_name ?? studentId);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-100 via-white to-sky-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-blue-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md px-4 py-10">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-300/40 backdrop-blur">
          <div className="mb-6">
            <p className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              NBU Activity
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Activity Check-in</h1>
            <p className="mt-1 text-sm text-slate-600">
              Activity: <span className="font-medium text-slate-800">{activityName || activity || "-"}</span>
            </p>
          </div>

          {stage === "loading" ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Loading...
            </div>
          ) : null}

          {errorMessage ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {statusMessage ? (
            <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {statusMessage}
            </p>
          ) : null}

          {stage === "redirecting" ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              Redirecting to LINE OA chat...
            </div>
          ) : null}

          {stage === "summary" ? (
            <div className="space-y-4 rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50 to-white p-5">
              <p className="text-sm font-medium text-emerald-700">Ready to continue</p>
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Activity:</span> {activityName || activity || "-"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Student:</span> {studentName || "-"}
                </p>
              </div>
              <button
                type="button"
                onClick={openLineOaChat}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open LINE OA Chat ({lineOaId || "OA"})
              </button>
            </div>
          ) : null}

          {stage === "verify" ? (
            <form className="space-y-4" onSubmit={onVerifySubmit}>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium" htmlFor="student_id">
                  Student ID
                </label>
                <input
                  id="student_id"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-sky-200 transition focus:border-sky-400 focus:ring-4"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium" htmlFor="date_of_birth">
                  Date of Birth
                </label>
                <input
                  id="date_of_birth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-sky-200 transition focus:border-sky-400 focus:ring-4"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium" htmlFor="id_number">
                  Citizen ID / Passport No.
                </label>
                <input
                  id="id_number"
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none ring-sky-200 transition focus:border-sky-400 focus:ring-4"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-slate-800 hover:to-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Verify and Check-in"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function LiffPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50 text-slate-900" />}>
      <LiffPageContent />
    </Suspense>
  );
}