"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { useWallet } from "@/context/WalletProvider";
import { toast } from "@/context/ToastContext";
import {
  ApiSessionExpiredError,
  apiFetch,
} from "@/lib/api/client";
import { PendingBadge } from "@/components/ui/PendingBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton-list";
import { SubmissionTimeline } from "@/features/hunters/SubmissionTimeline";
import {
  SUBMISSION_TABS,
  getSubmissionAction,
  getSubmissionTab,
  type SubmissionStatus,
  type SubmissionSummary,
  type SubmissionTab,
} from "@/features/hunters/submission-status";

interface MySubmission extends SubmissionSummary {
  id: string;
  missionId: string;
  hunterAddress: string;
  ipfsCid: string;
  textPayload: string | null;
  sentiment: number | null;
  status: SubmissionStatus;
  rejectionReason: string | null;
  createdAt: string;
  mission: {
    id: string;
    title: string;
    status: string;
    rewardToken: string;
    rewardAmount: string;
  };
}

type LoadState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "ready"; submissions: MySubmission[] }
  | { phase: "error"; message: string }
  | { phase: "session-expired" };

const EMPTY_SUBMISSIONS: MySubmission[] = [];

function StatusBadge({
  status,
  reason,
}: {
  status: SubmissionStatus;
  reason: string | null;
}) {
  switch (status) {
    case "PENDING":
      return (
        <span className="flex items-center gap-2">
          <PendingBadge />
          <span className="text-xs text-muted-foreground">Review in progress</span>
        </span>
      );
    case "APPROVED":
      return (
        <span className="inline-flex items-center border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
          Approved
        </span>
      );
    case "PAID":
      return (
        <span className="inline-flex items-center border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          Paid
        </span>
      );
    case "REJECTED":
      return (
        <span
          className="inline-flex items-center border border-red-400/40 bg-red-400/10 px-2.5 py-1 text-xs font-semibold text-red-300"
          title={reason ?? undefined}
        >
          Rejected
        </span>
      );
    case "DISPUTED":
      return (
        <span className="inline-flex items-center border border-orange-400/40 bg-orange-400/10 px-2.5 py-1 text-xs font-semibold text-orange-300">
          Disputed
        </span>
      );
  }
}

function PrimaryAction({ submission }: { submission: MySubmission }) {
  const action = getSubmissionAction(submission);

  if (action.kind === "link" && action.href) {
    if (action.href.startsWith("http")) {
      return (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase tracking-wide"
        >
          {action.label}
          <ExternalLink className="size-4" />
        </a>
      );
    }
    return (
      <Link
        href={action.href}
        className="inline-flex min-h-11 items-center justify-center brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase tracking-wide"
      >
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        toast.info(action.label, {
          id: `submission-action-${submission.id}`,
          description: "This action opens in the full report workflow.",
        })
      }
      className="inline-flex min-h-11 items-center justify-center gap-2 brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase tracking-wide"
    >
      {action.kind === "reply" ? <MessageCircle className="size-4" /> : null}
      {action.label}
    </button>
  );
}

function SubmissionItem({ submission }: { submission: MySubmission }) {
  return (
    <>
      <article className="hidden border-b border-foreground/20 py-6 md:block">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/hunter/mission-board"
                className="line-clamp-1 text-xl font-black uppercase hover:underline"
              >
                {submission.mission.title || "Mission"}
              </Link>
              <StatusBadge
                status={submission.status}
                reason={submission.rejectionReason}
              />
              {submission.unreadCommentCount ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-foreground">
                  <MessageCircle className="size-3" />
                  {submission.unreadCommentCount} new
                </span>
              ) : null}
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4" />
              {new Date(submission.createdAt).toLocaleDateString()}
            </p>
            {submission.textPayload ? (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                {submission.textPayload}
              </p>
            ) : null}
            {submission.status === "REJECTED" && submission.rejectionReason ? (
              <p className="mt-3 text-sm font-semibold text-red-300">
                Reason: {submission.rejectionReason}
              </p>
            ) : null}
            <SubmissionTimeline
              submission={submission}
              className="mt-6 grid gap-3 sm:grid-cols-4"
            />
          </div>
          <div className="flex flex-col items-start justify-between gap-4">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Reward
              </p>
              <p className="text-xl font-black">
                {submission.mission.rewardAmount} {submission.mission.rewardToken}
              </p>
            </div>
            <PrimaryAction submission={submission} />
          </div>
        </div>
      </article>

      <article className="border border-foreground bg-card p-4 brutal-shadow md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-base font-black uppercase">
              {submission.mission.title || "Mission"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(submission.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className="shrink-0 text-sm font-black">
            {submission.mission.rewardAmount} {submission.mission.rewardToken}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge
            status={submission.status}
            reason={submission.rejectionReason}
          />
          {submission.unreadCommentCount ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold">
              <MessageCircle className="size-3" />
              {submission.unreadCommentCount} new
            </span>
          ) : null}
        </div>
        <SubmissionTimeline
          submission={submission}
          className="mt-5 grid gap-3"
        />
        <div className="mt-5">
          <PrimaryAction submission={submission} />
        </div>
      </article>
    </>
  );
}

export default function MySubmissionsPage() {
  const { connected, publicKey, authenticate } = useWallet();
  const [state, setState] = useState<LoadState>({ phase: "idle" });
  const [activeTab, setActiveTab] = useState<SubmissionTab>("review");

  const load = useCallback(async () => {
    if (!publicKey) return;

    setState({ phase: "loading" });
    try {
      const response = await apiFetch("/hunter/my-submissions", {
        address: publicKey,
      });
      if (!response.ok) {
        throw new Error(`Unable to load submissions (${response.status})`);
      }
      const submissions = (await response.json()) as MySubmission[];
      setState({ phase: "ready", submissions });
    } catch (error) {
      if (error instanceof ApiSessionExpiredError) {
        setState({ phase: "session-expired" });
        return;
      }
      setState({
        phase: "error",
        message:
          error instanceof Error ? error.message : "Unable to load submissions",
      });
    }
  }, [publicKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const submissions = useMemo(
    () => (state.phase === "ready" ? state.submissions : EMPTY_SUBMISSIONS),
    [state],
  );

  const counts = useMemo(() => {
    const result = {} as Record<SubmissionTab, number>;
    for (const tab of SUBMISSION_TABS) {
      result[tab.id] = submissions.filter(
        (submission) => getSubmissionTab(submission.status) === tab.id,
      ).length;
    }
    return result;
  }, [submissions]);

  const visible = useMemo(
    () =>
      submissions.filter(
        (submission) => getSubmissionTab(submission.status) === activeTab,
      ),
    [submissions, activeTab],
  );

  const handleConnectSession = async () => {
    try {
      await authenticate();
      await load();
    } catch (error) {
      setState({
        phase: "error",
        message:
          error instanceof Error
            ? error.message
            : "Authentication failed. Try again.",
      });
    }
  };

  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen bg-background brutal-grid-bg px-6 py-10 text-foreground">
        <p className="text-sm uppercase tracking-[0.24em] text-foreground">
          Hunter
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase">My Submissions</h1>
        <p className="mt-6 text-muted-foreground">
          Connect your wallet to see your submission history.
        </p>
      </div>
    );
  }

  if (state.phase === "session-expired") {
    return (
      <div className="min-h-screen bg-background brutal-grid-bg px-6 py-10 text-foreground">
        <p className="text-sm uppercase tracking-[0.24em] text-foreground">
          Hunter
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase">My Submissions</h1>
        <p className="mt-6 max-w-xl text-muted-foreground">
          Your API session expired. Re-authenticate with your wallet to refresh
          your submissions.
        </p>
        <button
          type="button"
          onClick={() => void handleConnectSession()}
          className="mt-6 inline-flex min-h-11 items-center brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase"
        >
          Sign in again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background brutal-grid-bg px-5 py-10 text-foreground sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-foreground">
            Hunter
          </p>
          <h1 className="mt-3 text-3xl font-black uppercase sm:text-4xl">
            My Submissions
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Track every report, its proof, and the next action you can take.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={state.phase === "loading"}
          className="inline-flex min-h-11 items-center gap-2 brutal-border brutal-shadow bg-card px-4 text-sm font-bold uppercase disabled:opacity-50"
        >
          <RefreshCw
            className={`size-4 ${state.phase === "loading" ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div
        className="mt-8 flex gap-x-6 gap-y-2 overflow-x-auto border-b border-foreground/30"
        role="tablist"
        aria-label="Submission status"
      >
        {SUBMISSION_TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative shrink-0 pb-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-2 border border-foreground px-1.5 py-0.5 text-xs">
                {counts[tab.id]}
              </span>
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brutal-pink" />
              ) : null}
            </button>
          );
        })}
      </div>

      {state.phase === "loading" ? (
        <div className="mt-8">
          <SkeletonList count={3} variant="submission" />
        </div>
      ) : state.phase === "error" ? (
        <div className="mt-10">
          <p className="text-muted-foreground">{state.message}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-4 text-sm font-bold uppercase underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={`No ${SUBMISSION_TABS.find((tab) => tab.id === activeTab)?.label.toLowerCase()} reports`}
            description="Reports move here automatically when their status changes."
            icon={FileText}
            variant="card"
            action={{
              label: "Browse Mission Board",
              href: "/hunter/mission-board",
            }}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {visible.map((submission) => (
            <SubmissionItem key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}
