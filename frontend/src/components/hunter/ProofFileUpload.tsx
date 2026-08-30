"use client";

import { useRef, useState } from "react";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  FileValidationError,
  MAX_UPLOAD_SIZE_BYTES,
  uploadFileToIpfs,
} from "@/lib/upload-api";
import { AlertCircle, CheckCircle2, Loader2, Paperclip, UploadCloud, X } from "lucide-react";

interface ProofFileUploadProps {
  hunterAddress: string | null | undefined;
  onUploadComplete: (cid: string, file: File) => void;
  onUploadError?: (message: string) => void;
  disabled?: boolean;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export default function ProofFileUpload({
  hunterAddress,
  onUploadComplete,
  onUploadError,
  disabled,
}: ProofFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setState("idle");
    setProgress(0);
    setFileName(null);
    setCid(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileSelected = async (file: File) => {
    setError(null);

    if (!hunterAddress) {
      const msg = "Connect your wallet before attaching a proof file.";
      setError(msg);
      setState("error");
      onUploadError?.(msg);
      return;
    }

    setFileName(file.name);
    setState("uploading");
    setProgress(0);

    try {
      const { cid: uploadedCid } = await uploadFileToIpfs(file, hunterAddress, setProgress);
      setCid(uploadedCid);
      setState("success");
      onUploadComplete(uploadedCid, file);
    } catch (err: unknown) {
      const msg =
        err instanceof FileValidationError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to upload proof file.";
      setError(msg);
      setState("error");
      onUploadError?.(msg);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  const acceptAttr = ALLOWED_UPLOAD_MIME_TYPES.join(",");
  const maxSizeMb = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptAttr}
        onChange={onInputChange}
        disabled={disabled || state === "uploading"}
        className="hidden"
        aria-label="Upload proof file"
      />

      {state === "idle" && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 text-sm text-white/60 transition-colors hover:border-[#B78CFF]/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UploadCloud className="size-4" />
          Attach screenshot, video, or PDF proof
        </button>
      )}

      {state === "uploading" && (
        <div className="rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 shrink-0 animate-spin text-[#B78CFF]" />
            <span className="truncate">{fileName}</span>
            <span className="ml-auto shrink-0 text-xs text-white/50">{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#B78CFF] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === "success" && cid && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 truncate">
              <Paperclip className="size-3 shrink-0" />
              <span className="truncate">{fileName}</span>
            </div>
            <span className="block truncate font-mono text-xs text-emerald-400/80">{cid}</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-lg p-1 text-emerald-300/70 hover:bg-white/10 hover:text-white"
            aria-label="Remove attached proof file"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="size-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-xs font-medium text-[#B78CFF] hover:underline"
          >
            Try a different file
          </button>
        </div>
      )}

      <p className="mt-1.5 text-[11px] text-white/40">
        Images, MP4, or PDF up to {maxSizeMb}MB. Pinned to IPFS before your on-chain submission.
      </p>
    </div>
  );
}
