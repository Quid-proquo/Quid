'use client'
import { use } from "react";
import { useQuestData } from "@/app/hooks/useQuestData";
import CreatorQuestDetail from "@/features/creators/CreatorQuestDetail";


export default function QuestDetailPage({ params }: { params: Promise<{ questId: string }> }) {
  const { questId } = use(params);
  const { quest, submissions } = useQuestData(questId);

  return (
    <CreatorQuestDetail
      // quest={quest}
      submissions={submissions}
    />
  );
}
