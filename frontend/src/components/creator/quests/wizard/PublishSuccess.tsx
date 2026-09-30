import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import type { MissionEscrowResult } from "@/lib/mission-escrow";

export default function PublishSuccess({ result }: { result: MissionEscrowResult }) {
  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${result.txHash}`;

  return (
    <div className="flex h-full min-h-[calc(100vh-5rem)] flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <CheckCircle2 className="size-16 text-emerald-400" />
      <h2 className="text-2xl font-semibold text-foreground">
        Quest Published Successfully
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your quest has been added to the campaign and the reward escrow is
        locked on-chain.
      </p>

      <div className="mt-2 w-full max-w-sm space-y-2 border border-foreground/30 bg-[#100D1C]/60 p-4 text-left text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Mission ID</span>
          <span className="font-mono text-foreground">#{result.missionId}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Metadata CID</span>
          <span className="truncate font-mono text-muted-foreground" title={result.metadataCid}>
            {result.metadataCid}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Transaction</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[#B78CFF] hover:underline"
          >
            {result.txHash.slice(0, 12)}…
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <Link
          href="/creator/quests"
          className=" border border-white/15 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
        >
          Close
        </Link>
        <Link
          href={`/creator/quests/${result.missionId}`}
          className="flex items-center gap-1.5  bg-[#8B5CF6] px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-[#7c0de0]"
        >
          View quest
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
