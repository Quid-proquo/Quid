"use client";
import { Submission } from "@/app/hooks/useQuestData";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function SubmissionCard({
  submission,
  onApprove,
}: {
  submission: Submission;
  onApprove: () => void;
}) {
  const [selectWinner, setSelectWinner] = useState<Record<number, boolean>>({});
  return (
    <div className="p-3">
      {/* ABOUT SURVEY  */}
      <div>
        <div className="flex justify-between items-center bg-[#141026] rounded-2xl p-4 m-4">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl text-white font-medium">
              It's time to select the winners
            </h2>
            <p className="text-[#CFC9FF] text-xs flex items-center gap-2">
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
          <div className="flex flex-col gap-2">
            <h4 className="text-sm text-white">Winners selected</h4>
            <p className="text-white font-semibold text-2xl text-right">
              8/ <span className="text-[#CFC9FF]">24</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-6">
          <div
            className="flex justify-between items-center text-white px-4"
          >
            <div className="flex items-center gap-2">
              <img
                src="/quest-detail/avatar-quid.png"
                alt=""
                className="size-12 rounded-full"
              />
              <div className="flex flex-col gap-0 ">
                <p className="text-[#CFC9FF] text-sm">Submitted {typeof submission.date === 'object' ? submission.date.toLocaleDateString() : submission.date}</p>
                <p>{submission.user}</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <img
                onClick={() =>
                  setSelectWinner((prev) => ({
                    ...prev,
                    [submission.id]: !prev[submission.id],
                  }))
                }
                src="/quest-detail/stellar-icon.png"
                alt=""
                className={`size-8 p-2 cursor-pointer ${selectWinner[submission.id] ? "bg-[#9011FF] rounded-full " : ""}`}
              />
              <Icon icon={"lucide:heart"} className="size-6" />
            </div>
          </div>
        </div>
        </div>
      </div>
  
  );
}
