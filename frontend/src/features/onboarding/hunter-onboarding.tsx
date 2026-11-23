"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Compass,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Networks } from "@stellar/stellar-sdk";
import { useWallet as useWalletContext } from "@/context/WalletProvider";
import { useWallet as useWalletData } from "@/app/hooks/useWallet";
import {
  getHunterOnboardingProgress,
  saveHunterOnboardingProgress,
  type HunterOnboardingProgress,
  type HunterOnboardingStep,
} from "@/lib/onboarding";

const SKILLS = [
  "Bug hunting",
  "UX feedback",
  "Accessibility",
  "Security review",
  "Performance",
  "Localization",
] as const;

const STEPS: {
  id: HunterOnboardingStep;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "skills",
    label: "Choose skills",
    description: "Pick what you can test so we can suggest missions.",
    icon: Compass,
  },
  {
    id: "wallet",
    label: "Connect wallet",
    description: "Freighter is required to accept and submit missions.",
    icon: Wallet,
  },
  {
    id: "funding",
    label: "Fund account",
    description: "A small testnet balance covers your first transaction.",
    icon: CircleDollarSign,
  },
  {
    id: "practice",
    label: "Practice report",
    description: "Draft a report so you know what a strong submission looks like.",
    icon: Sparkles,
  },
];

const ORDER: HunterOnboardingStep[] = [
  "skills",
  "wallet",
  "funding",
  "practice",
  "complete",
];

interface PracticeForm {
  title: string;
  steps: string;
  expected: string;
  actual: string;
}

const EMPTY_FORM: PracticeForm = {
  title: "",
  steps: "",
  expected: "",
  actual: "",
};

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function subscribe(): () => void {
  return () => {};
}

export function HunterOnboarding() {
  const {
    connected,
    publicKey,
    connect,
    expectedNetwork,
  } = useWalletContext();
  const wallet = useWalletData();
  const address = publicKey ?? "";
  const [override, setOverride] = useState<{
    address: string;
    progress: HunterOnboardingProgress;
  } | null>(null);
  const storedProgress = useSyncExternalStore<HunterOnboardingProgress | null>(
    subscribe,
    () => getHunterOnboardingProgress(publicKey),
    () => null,
  );
  const [form, setForm] = useState<PracticeForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const progress =
    override?.address === address ? override.progress : storedProgress;
  const stepIndex = progress ? ORDER.indexOf(progress.step) : 0;
  const isComplete = progress?.step === "complete" || progress?.skipped;

  const update = (patch: Partial<HunterOnboardingProgress>) => {
    if (!progress) return;
    const next = { ...progress, ...patch };
    saveHunterOnboardingProgress(next, publicKey);
    setOverride({ address, progress: next });
  };

  const toggleSkill = (skill: string) => {
    if (!progress) return;
    const skills = progress.skills.includes(skill)
      ? progress.skills.filter((entry) => entry !== skill)
      : [...progress.skills, skill];
    update({ skills });
  };

  const goNext = () => {
    if (!progress || stepIndex >= STEPS.length - 1) return;
    update({ step: ORDER[stepIndex + 1] });
  };

  const goBack = () => {
    if (!progress || stepIndex <= 0) return;
    update({ step: ORDER[stepIndex - 1] });
  };

  const handleConnect = async () => {
    setBusy(true);
    setError(null);
    try {
      const address = await connect();
      if (!address) throw new Error("No address was returned by Freighter.");
      update({ step: "funding" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to connect wallet.");
    } finally {
      setBusy(false);
    }
  };

  const handleFund = async () => {
    setBusy(true);
    setError(null);
    try {
      await wallet.fundWithFriendbot();
      update({ step: "practice" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Friendbot funding failed.");
    } finally {
      setBusy(false);
    }
  };

  const handlePractice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.title.trim() ||
      !form.steps.trim() ||
      !form.expected.trim() ||
      !form.actual.trim()
    ) {
      setError("Complete every field before saving the practice report.");
      return;
    }
    setError(null);
    update({
      step: "complete",
      practicePassed: true,
      completedAt: new Date().toISOString(),
    });
  };

  const handleSkip = () => {
    update({
      step: "complete",
      skipped: true,
      completedAt: new Date().toISOString(),
    });
  };

  if (!progress) {
    return (
      <div className="border border-foreground bg-card p-6 brutal-shadow">
        <Loader2 className="size-5 animate-spin" />
        <p className="mt-3 text-sm text-muted-foreground">Loading your setup...</p>
      </div>
    );
  }

  return (
    <section className="border border-foreground bg-card p-6 brutal-shadow sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-foreground">
            Hunter onboarding
          </p>
          <h1 className="mt-2 text-2xl font-black uppercase sm:text-3xl">
            Get ready for your first mission
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Four quick steps. Your progress is saved on this device.
          </p>
        </div>
        {!isComplete ? (
          <button
            type="button"
            onClick={handleSkip}
            className="min-h-11 px-3 text-xs font-bold uppercase text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Skip for now
          </button>
        ) : null}
      </div>

      <ol className="mt-7 grid gap-2 sm:grid-cols-4">
        {STEPS.map((item, index) => {
          const done = index < stepIndex || isComplete;
          const active = index === stepIndex && !isComplete;
          const Icon = item.icon;
          return (
            <li
              key={item.id}
              className={`border p-3 ${active ? "border-foreground bg-brutal-yellow/20" : done ? "border-foreground/60 bg-brutal-lime/10" : "border-foreground/20"}`}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center border border-foreground text-xs font-black">
                  {done ? <Check className="size-4" /> : index + 1}
                </span>
                <Icon className="size-4" />
                <span className="text-xs font-bold uppercase">{item.label}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 border-t border-foreground/20 pt-6">
        {progress.step === "skills" ? (
          <div>
            <h2 className="text-lg font-black uppercase">What can you test?</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {SKILLS.map((skill) => {
                const selected = progress.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSkill(skill)}
                    className={`min-h-11 border px-3 text-sm font-bold ${selected ? "border-foreground bg-brutal-lime" : "border-foreground/40 bg-background"}`}
                  >
                    {selected ? <Check className="mr-1 inline size-4" /> : null}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {progress.step === "wallet" ? (
          <div>
            <h2 className="text-lg font-black uppercase">Connect Freighter</h2>
            {connected && publicKey ? (
              <p className="mt-3 border border-foreground/30 bg-background p-3 text-sm">
                Connected: <span className="font-mono">{shortAddress(publicKey)}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => void handleConnect()}
                disabled={busy}
                className="mt-4 inline-flex min-h-11 items-center gap-2 brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
                Connect Freighter
              </button>
            )}
          </div>
        ) : null}

        {progress.step === "funding" ? (
          <div>
            <h2 className="text-lg font-black uppercase">Fund your testnet account</h2>
            {wallet.loading ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Checking ledger...
              </p>
            ) : wallet.funded ? (
              <p className="mt-3 flex items-center gap-2 text-sm font-bold">
                <ShieldCheck className="size-4" /> Account is funded and ready.
              </p>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  Friendbot adds 10,000 XLM on testnet. This is not real money.
                </p>
                <button
                  type="button"
                  onClick={() => void handleFund()}
                  disabled={
                    busy ||
                    wallet.funding ||
                    expectedNetwork !== Networks.TESTNET
                  }
                  className="mt-4 inline-flex min-h-11 items-center gap-2 brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase disabled:opacity-50"
                >
                  {wallet.funding ? <Loader2 className="size-4 animate-spin" /> : null}
                  Fund with Friendbot
                </button>
                {expectedNetwork !== Networks.TESTNET ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Switch Freighter to testnet to use Friendbot.
                  </p>
                ) : null}
              </div>
            )}
            {wallet.error ? (
              <p className="mt-3 text-sm font-semibold text-red-400">{wallet.error}</p>
            ) : null}
          </div>
        ) : null}

        {progress.step === "practice" ? (
          <form id="practice-form" onSubmit={handlePractice}>
            <h2 className="text-lg font-black uppercase">Write a practice report</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This stays on your device. It is only a rehearsal for real missions.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-bold">
                Issue title
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  className="min-h-11 border border-foreground/40 bg-background px-3 font-normal"
                  placeholder="Checkout button is not tappable"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Steps to reproduce
                <input
                  value={form.steps}
                  onChange={(event) =>
                    setForm({ ...form, steps: event.target.value })
                  }
                  className="min-h-11 border border-foreground/40 bg-background px-3 font-normal"
                  placeholder="Open, scroll, tap checkout"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Expected result
                <input
                  value={form.expected}
                  onChange={(event) =>
                    setForm({ ...form, expected: event.target.value })
                  }
                  className="min-h-11 border border-foreground/40 bg-background px-3 font-normal"
                  placeholder="Checkout opens"
                />
              </label>
              <label className="grid gap-1 text-sm font-bold">
                Actual result
                <input
                  value={form.actual}
                  onChange={(event) =>
                    setForm({ ...form, actual: event.target.value })
                  }
                  className="min-h-11 border border-foreground/40 bg-background px-3 font-normal"
                  placeholder="Nothing happens"
                />
              </label>
            </div>
          </form>
        ) : null}

        {isComplete ? (
          <div>
            <h2 className="text-lg font-black uppercase">You are ready</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {progress.skipped
                ? "You skipped the walkthrough. You can restart it anytime."
                : "Your practice report is saved. Find a mission and put it to work."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/hunter/mission-board"
                className="inline-flex min-h-11 items-center brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase"
              >
                Find first mission
              </Link>
              <button
                type="button"
                onClick={() =>
                  update({
                    step: "skills",
                    skipped: false,
                    completedAt: null,
                    practicePassed: false,
                  })
                }
                className="inline-flex min-h-11 items-center border border-foreground/40 px-4 text-sm font-bold uppercase"
              >
                Restart walkthrough
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm font-semibold text-red-400">{error}</p>
        ) : null}

        {!isComplete ? (
          <div className="mt-7 flex items-center justify-between gap-3 border-t border-foreground/20 pt-5">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-bold uppercase disabled:opacity-40"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
            {progress.step === "practice" ? (
              <button
                type="submit"
                form="practice-form"
                className="inline-flex min-h-11 items-center gap-2 brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase"
              >
                Finish <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={progress.step === "wallet" && !connected}
                className="inline-flex min-h-11 items-center gap-2 brutal-border brutal-shadow bg-brutal-yellow px-4 text-sm font-bold uppercase disabled:opacity-50"
              >
                Next <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
