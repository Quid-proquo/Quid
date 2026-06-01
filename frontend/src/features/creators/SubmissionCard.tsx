"use client";
import { Submission } from "@/app/hooks/useQuestData";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function SubmissionCard({
  submission,
  onApprove,
  isApproved,
}: {
  submission: Submission;
  onApprove: () => void;
  isApproved?: boolean;
}) {
  const [selectWinner, setSelectWinner] = useState<Record<string, boolean>>({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20 text-green-400 border border-green-500";
      case "rejected":
        return "bg-red-500/20 text-red-400 border border-red-500";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500";
    }
  };
  return (
    <div className="p-2 md:p-3">
      {/* ABOUT SURVEY  */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#141026] rounded-2xl p-3 md:p-4 m-2 md:m-4 gap-4 md:gap-0">
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <h2 className="text-lg md:text-xl text-white font-medium">
              It&apos;s time to select the winners
            </h2>
            <p className="text-[#CFC9FF] text-xs md:text-sm flex items-center gap-2">
              Click this{" "}
              <span>
                <img
                  src="/quest-detail/stellar-icon.png"
                  alt=""
                  className="size-4"
                />
              </span>{" "}
              icon to add a winner
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <h4 className="text-xs md:text-sm text-white">Winners selected</h4>
            <p className="text-white font-semibold text-lg md:text-2xl md:text-right">
              8/ <span className="text-[#CFC9FF]">24</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6">
          <div
            className="flex flex-col md:flex-row justify-between items-start md:items-center text-white px-2 md:px-4 gap-4 md:gap-0 w-full"
          >
            <div className="flex items-center gap-2 flex-1">
              <img
                src="/quest-detail/avatar-quid.png"
                alt=""
                className="size-10 md:size-12 rounded-full"
              />
              <div className="flex flex-col gap-1 flex-1">
                <p className="text-sm md:text-base font-medium">{submission.user}</p>
                <p className="text-[#CFC9FF] text-xs md:text-sm">Submitted {typeof submission.date === 'object' ? submission.date.toLocaleDateString() : submission.date}</p>
                <p className="text-xs md:text-sm text-gray-400 truncate">{submission.content}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              {/* Status Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(submission.status)}`}>
                {submission.status}
              </span>
              
              {/* Approve Button - Only for pending */}
              {submission.status === "pending" && (
                <button
                  onClick={onApprove}
                  className="bg-[#9011FF] hover:bg-[#7d0dd4] text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  title="Approve submission"
                >
                  ✓ Approve
                </button>
              )}
              
              {/* Winner Selection Icon */}
              <img
                onClick={() =>
                  setSelectWinner((prev) => ({
                    ...prev,
                    [submission.id]: !prev[submission.id],
                  }))
                }
                src="/quest-detail/stellar-icon.png"
                alt="Select as winner"
                className={`size-6 md:size-8 p-1 md:p-2 cursor-pointer transition-colors ${selectWinner[submission.id] ? "bg-[#9011FF] rounded-full" : "hover:opacity-80"}`}
              />
            </div>
          </div>
        </div>
        </div>
      </div>
  
  );
}
