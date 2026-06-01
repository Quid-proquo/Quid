import Image from "next/image";
import Link from "next/link";
import { HiBriefcase } from "react-icons/hi2";

export default function QuestItem({
  title,
  tag,
  category,
  reward,
  deadline,
  score,
  id
}: {
  title: string;
  tag?: string;
  category: string;
  reward: string;
  deadline: string;
  score: number;
  id: string
}) {
  return (
    <Link
      href={`/creator/quests/${id}`}
      className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 border-b border-b-[#241B4A] pb-4 cursor-pointer hover:bg-neutral-800"
    >
      {/* Left Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-4">
        <Image src="/namelogo.png" alt="Logo" width={72} height={72} />

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4>{title}</h4>
            {tag && (
              <span className="bg-[#9011FF] rounded-lg text-white text-xs px-2 py-1">
                {tag}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <HiBriefcase className="w-[12.67px] h-[12.67px]" />
              <span>{category}</span>
            </div>

            <div className="flex items-center gap-1">
              <Image
                src="/stellarlogo.png"
                alt="Logo"
                width={12.67}
                height={12.67}
              />
              <span>{reward}</span>
            </div>

            <span className="text-xs text-[#8C86B8]">{deadline}</span>
          </div>
        </div>
      </div>

      {/* Right Section (Score) */}
      <div className="flex items-center gap-1.5">
        <HiBriefcase className="w-[19px] h-[19px] text-[#9011FF]" />
        <span>{score}</span>
      </div>
    </Link>
  );
}
