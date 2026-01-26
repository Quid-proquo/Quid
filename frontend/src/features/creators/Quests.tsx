import { FaPlus, FaFile } from "react-icons/fa";

type QuestAction = {
  title: string;
  icon: React.ReactNode;
};

const actions: QuestAction[] = [
  {
    title: "Create New Quest",
    icon: <FaPlus className="text-[#9011FF] w-9 h-9" />,
  },
  {
    title: "Create New Quest",
    icon: <FaFile className="text-[#9011FF] w-9 h-9" />,
  },
  {
    title: "Create New Quest",
    icon: <FaFile className="text-[#9011FF] w-9 h-9" />,
  },
];
function QuestActionCard({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button className="flex flex-col items-center gap-2 cursor-pointer">
      <div className="bg-[#1B1540] w-[130px] h-[116px] md:w-[154px] md:h-[136px] flex items-center justify-center rounded-lg">
        {icon}
      </div>
      <h2>{title}</h2>
    </button>
  );
}

export default function Quests() {
  return (
    <div className="flex items-center gap-6 py-8 flex-wrap justify-center md:justify-start">
      {actions.map((action, index) => (
        <QuestActionCard key={index} {...action} />
      ))}
    </div>
  );
}
