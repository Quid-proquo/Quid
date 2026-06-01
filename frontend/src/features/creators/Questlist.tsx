"use client";

import { useState } from "react";
import QuestItem from "./QuestItem";

type Tab = "available" | "completed";

const tabs: { label: string; value: Tab }[] = [
  { label: "Available Quest", value: "available" },
  { label: "Completed", value: "completed" },
];

const availableQuests = [
  {
    id: "1",
    title: "Download and test the latest Ruze.stellar 2.0",
    tag: "Awaiting Review",
    category: "Product",
    reward: "10 XLM (640)",
    deadline: "Expired 2d ago",
    score: 72,
  },
  {
    id: "2",
    title: "Review and implement feedback for Ruze.stellar 2.0",
    category: "Development",
    reward: "10 XLM (640)",
    deadline: "Due in 4d",
    score: 23,
  },
  {
    id: "3",
    title: "Finalize marketing strategy for Ruze.stellar 2.0",
    category: "Marketing",
    reward: "10 XLM (640)",
    deadline: "Due in 14d",
    score: 11,
  },
  {
    id: "4",
    title: "Prepare launch event for Ruze.stellar 2.0",
    category: "Events",
    reward: "10 XLM (640)",
    deadline: "Due in 16d",
    score: 8,
  },
];

function CompletedState() {
  return (
    <div className="text-center text-[#8C86B8] py-12">
      <p>No completed quests yet.</p>
    </div>
  );
}

export default function Questlist() {
  const [activeTab, setActiveTab] = useState<Tab>("available");


  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-6 border-b border-[#241B4A] text-sm font-medium text-[#8C86B8]">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`pb-3 relative ${
              activeTab === tab.value
                ? "text-white after:absolute after:left-0 after:bottom-[-1px] after:h-[2px] after:w-full after:bg-[#B48CFF]"
                : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pt-6 flex flex-col gap-6">
        {activeTab === "available" ? (
          <div
            className="flex flex-col gap-6 "
           
          >
            {availableQuests.map((quest, idx) => (
              <QuestItem key={idx} {...quest} />
            ))}
          </div>
        ) : (
          <CompletedState />
        )}
      </div>
    </div>
  );
}
