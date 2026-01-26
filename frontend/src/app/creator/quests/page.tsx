import QuestHeader from "@/features/creators/QuestHeader";
import Questlist from "@/features/creators/Questlist";
import Quests from "@/features/creators/Quests";

export default function QuestsPage() {
  return (
    <section className="min-h-full  text-white px-6">
      <QuestHeader />
      <Quests />
      <Questlist />
    </section>
  );
}
