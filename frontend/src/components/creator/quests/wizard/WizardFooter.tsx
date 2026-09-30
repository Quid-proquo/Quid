import { ArrowRight, Eye, Loader2, Save } from "lucide-react";

export default function WizardFooter({
  isFirstStep,
  isLastStep,
  canContinue,
  busy = false,
  busyLabel,
  onBack,
  onPreview,
  onSaveDraft,
  onContinue,
}: {
  isFirstStep: boolean;
  isLastStep: boolean;
  canContinue: boolean;
  /** Disables the footer while the publish escrow flow is in flight. */
  busy?: boolean;
  /** Label shown on the continue button while busy. */
  busyLabel?: string;
  onBack: () => void;
  onPreview: () => void;
  onSaveDraft: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-foreground/30 px-6 py-4">
      {isFirstStep ? (
        <span />
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back
        </button>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onPreview}
          className="flex items-center gap-1.5  border border-white/15 px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="size-4" />
          Preview
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSaveDraft}
          className="flex items-center gap-1.5  border border-white/15 px-3.5 py-2 text-sm text-foreground transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="size-4" />
          Save as draft
        </button>
        <button
          type="button"
          disabled={!canContinue || busy}
          onClick={onContinue}
          className="flex items-center gap-1.5  bg-[#8B5CF6] px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-[#7c0de0] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted-foreground"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {busyLabel ?? "Working…"}
            </>
          ) : (
            <>
              {isLastStep ? "Publish quest" : "Continue"}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
