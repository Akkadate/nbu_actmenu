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

declare global {
  interface Window {
    liff?: {
      init: (config: { liffId: string }) => Promise<void>;
      isLoggedIn: () => boolean;
      login: (options?: { redirectUri?: string }) => void;
      isInClient: () => boolean;
      openWindow: (options: { url: string; external?: boolean }) => void;
      getProfile: () => Promise<{ userId: string }>;
    };
  }
}

const LIFF_SCRIPT_SRC = "https://static.line-scdn.net/liff/edge/2/sdk.js";
function loadLiffScript(): Promise<void> {
  if (window.liff) {
    return Promise.resolve();
  }

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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [inLineClient, setInLineClient] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [activityName, setActivityName] = useState("");

  const [studentId, setStudentId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [idNumber, setIdNumber] = useState("");

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const lineOaId = process.env.NEXT_PUBLIC_LINE_OA_ID ?? "";
  const lineOaUrl = process.env.NEXT_PUBLIC_LINE_OA_URL ?? "";

  const isLineAppBrowser = () => /Line\//i.test(window.navigator.userAgent);

  const openLineOaChat = () => {
    if (!lineOaUrl) {
      setErrorMessage("Missing NEXT_PUBLIC_LINE_OA_URL");
      return;
    }
    window.location.replace(lineOaUrl);
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

    return data;
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
        // fall through to sessionStorage fallback
      }
    }

    const savedActivity = sessionStorage.getItem("activity_key") ?? "";
    setActivity(savedActivity);
  }, [activityParam, liffStateParam]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErrorMessage("");
      setStatusMessage("");

      try {
        if (!activity) {
          setLoading(false);
          setErrorMessage("Missing activity key");
          return;
        }

        if (!liffId) {
          throw new Error("Missing NEXT_PUBLIC_LIFF_ID");
        }

        await loadLiffScript();

        if (!window.liff) {
          throw new Error("LIFF SDK unavailable");
        }

        await window.liff.init({ liffId });
        const inClient = window.liff.isInClient() || isLineAppBrowser();
        setInLineClient(inClient);

        if (!window.liff.isLoggedIn()) {
          const redirectUri = new URL(window.location.href);
          if (!redirectUri.searchParams.get("activity") && activity) {
            redirectUri.searchParams.set("activity", activity);
          }
          window.liff.login({ redirectUri: redirectUri.toString() });
          return;
        }

        const profile = await window.liff.getProfile();
        const lineUserId = profile.userId;

        setUserId(lineUserId);

        const verificationRes = await fetch(
          `/api/check-verification?line_user_id=${encodeURIComponent(lineUserId)}`
        );
        const verificationData = (await verificationRes.json()) as VerifyResponse;

        if (!verificationRes.ok || !verificationData.success) {
          throw new Error(verificationData.error || "Failed to check verification");
        }

        if (verificationData.verified) {
          setIsVerified(true);
          setStudentName(verificationData.student_name ?? verificationData.student_id ?? "-");
          const enterResult = await enterActivity(lineUserId);
          setActivityName(enterResult.activity_name ?? activity);
          setStatusMessage("Entered activity successfully.");

          if (inClient) {
            openLineOaChat();
          } else {
            setCompleted(true);
          }
          return;
        }

        setIsVerified(false);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unexpected error");
      } finally {
        setLoading(false);
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
        setIsVerified(false);
        setStatusMessage("Verification failed. Please check your information.");
        return;
      }

      setIsVerified(true);
      setStudentName(verifyData.student_name ?? studentId);
      const enterResult = await enterActivity(userId);
      setActivityName(enterResult.activity_name ?? activity);
      setStatusMessage("Verified and entered activity successfully.");

      if (inLineClient || isLineAppBrowser()) {
        openLineOaChat();
      } else {
        setCompleted(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-semibold">Activity Check-in</h1>
          <p className="mt-1 text-sm text-slate-600">Activity Key: {activity || "-"}</p>

          {loading ? <p className="mt-4 text-sm">Loading...</p> : null}

          {errorMessage ? (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          ) : null}

          {statusMessage ? (
            <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {statusMessage}
            </p>
          ) : null}

          {!loading && completed && !inLineClient ? (
            <div className="mt-6 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm">
                <span className="font-medium">Activity:</span> {activityName || activity}
              </p>
              <p className="text-sm">
                <span className="font-medium">Student:</span> {studentName || "-"}
              </p>
              <a
                href={lineOaUrl || "#"}
                className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Go to LINE OA Chat ({lineOaId || "OA"})
              </a>
            </div>
          ) : null}

          {!loading && !isVerified && !completed ? (
            <form className="mt-6 space-y-4" onSubmit={onVerifySubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="student_id">
                  Student ID
                </label>
                <input
                  id="student_id"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="date_of_birth">
                  Date of Birth (DD-MM-YYYY)
                </label>
                <input
                  id="date_of_birth"
                  type="text"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="id_number">
                  ID Number
                </label>
                <input
                  id="id_number"
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Verify and Enter"}
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
