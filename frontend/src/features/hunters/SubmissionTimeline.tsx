import { ExternalLink } from 'lucide-react';
import { buildTimeline, type SubmissionSummary } from './submission-status';

const stateStyles: Record<string, string> = {
  complete: 'bg-brutal-lime text-foreground',
  current: 'bg-brutal-yellow text-foreground',
  failed: 'bg-brutal-pink text-foreground',
  upcoming: 'bg-muted text-muted-foreground',
};

export function SubmissionTimeline({
  submission,
  className,
}: {
  submission: SubmissionSummary;
  className?: string;
}) {
  const steps = buildTimeline(submission);

  return (
    <ol className={className ?? 'mt-4 grid gap-3 sm:grid-cols-4'}>
      {steps.map((step, index) => (
        <li key={step.key} className="flex items-start gap-3 sm:block">
          <div className="flex flex-col items-center sm:flex-row sm:items-center">
            <span
              className={`flex size-7 shrink-0 items-center justify-center border border-foreground text-xs font-black ${stateStyles[step.state]}`}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span className="h-6 w-px bg-foreground/30 sm:h-px sm:w-full" />
            ) : null}
          </div>
          <div className="min-w-0 sm:mt-2">
            <p className="text-sm font-bold">{step.label}</p>
            <p className="text-xs text-muted-foreground">{step.description}</p>
            {step.href && step.href !== '#' ? (
              <a
                href={step.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4"
              >
                View on explorer
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
