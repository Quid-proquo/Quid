"use client";
import { useState } from "react";
import EmptyState from "./EmptyState";
import QuestHeader from "./QuestHeader";
import SubmissionCard from "./SubmissionCard";
import TaskInfo from "./TaskInfo";
import { Icon } from "@iconify/react";
import { Submission } from "@/app/hooks/useQuestData";

export default function CreatorQuestDetail({
  // quest,
  submissions,
}: {
  // quest: Quest;
  submissions: Submission[];
}) {
  const handleApprove = (submissionId: string) => {
    // API call to approve submission
  };
  const [activeTab, setActiveTab] = useState<"details" | "response">("details");
  return (
    <div className="text-white px-3 py-1">
      <QuestHeader />
      <div className="font-inter">
        <div className="flex justify-normal items-center gap-4 text-white text-2xl py-6">
          <img
            src={"/quest-detail/npm-icon.png"}
            className="size-20"
            width={30}
          />
          <h3>Download and test the latest Ruze.stellar 2.0</h3>
        </div>
      </div>
      <div className="flex justify-normal items-start">
        <div className="w-[30%]">
          <p className="text-[#8C86B8] p-2">About survery</p>
          <div className=" border-t border-r border-b border-[#241B4A]">
            <div className="text-white flex flex-col gap-2 p-3 border-b border-b-[#241B4A] py-6">
              <p>Product link</p>
              <p className="bg-[#1B1540] p-2 rounded-lg">
                https://productlink.com
              </p>
            </div>
          </div>
          <div className=" border-r border-b border-[#241B4A] flex flex-col gap-2 items-start text-white p-2 py-6">
            <div className="flex items-center gap-2">
              <img
                src="/quest-detail/stellar-icon.png"
                alt=""
                className="size-6"
              />
              <h2 className="text-2xl font-semibold">640 XLM</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 bg-[#9011FF] rounded-full" />
              <p className="text-[#CFC9FF]">10 XLM per Winner</p>
            </div>
          </div>
          <div className=" border-r border-b border-[#241B4A] flex flex-col gap-2 items-start text-white p-2 py-6">
            <h2 className="text-2xl font-semibold">72</h2>
            <p className="text-[#CFC9FF]">Total Responses</p>
          </div>
          <div className=" border-r border-b border-[#241B4A] flex flex-col gap-2 items-start text-white p-2 py-6">
            <h2 className="text-2xl font-semibold">0h: 0m: 0s</h2>
            <p className="text-[#CFC9FF]">Time Left</p>
          </div>
          <div className=" border-r  border-[#241B4A] flex flex-col gap-1 items-start text-white p-2 py-4 h-screen">
            <p className="text-[#CFC9FF]">Winner announcement</p>
            <p>24th January, 2026</p>
          </div>
        </div>
        {/* END OF ABOUT SURVERY SECTION  */}
        <div className="w-[70%] ">
          <div className="flex justify-normal items-center gap-6 text-[#CFC9FF] p-0.75 pl-2  border-b-[#241B4A] border-b">
            {["Details", "Response"].map((tab) => (
              <button
                key={tab}
                className={`border-b-2 cursor-pointer flex items-center ${
                  activeTab.toLowerCase() === tab.toLowerCase()
                    ? "border-b-[#601AFF] text-white"
                    : "border-transparent text-[#CFC9FF]"
                }`}
                onClick={() =>
                  setActiveTab(
                    tab.toLowerCase() === "details" ? "details" : "response",
                  )
                }
              >
                {tab}
                {submissions.length > 0 && tab === "Response" && (
                  <span className="bg-[#9011FF] text-xs ml-2 py-1 mb-2 px-2 rounded-md ">
                    {submissions.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div>
            {activeTab === "details" ? (
              <TaskInfo />
            ) : submissions.length === 0 ? (
              <EmptyState message="No submissions yet." />
            ) : (
              submissions.map((sub) => (
                <SubmissionCard
                  key={sub.id}
                  submission={sub}
                  onApprove={() => handleApprove(sub.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
