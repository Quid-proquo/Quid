import Image from "next/image";

const badges = [
  {
    text: "Get community-verified insights",
    className: "left-6 top-[-30px] px-[20px] py-[15px] w-[300px]",
  },
  {
    text: "Exportable feedback data",
    className:
      "right-[30] top-[52%] -translate-y-1/2 px-[20px] py-[20px] w-[178px]",
  },
  {
    text: "Create quest-based surveys",
    className: "left-[-20] bottom-[-10] px-[20px] py-[20px] w-[300px]",
  },
];

export default function MoreFeatures() {
  return (
    <section className="relative overflow-hidden pb-24 pt-12 text-white">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:max-w-3xl lg:max-w-6xl lg:flex-row lg:items-center">
        <div className="relative w-full md:flex md:justify-center md:items-center lg:w-[45%]">
          <div className="relative mx-auto h-[536px] w-full max-w-[373px] overflow-hidden rounded-3xl p-3 shadow-[0_30px_80px_rgba(11,6,30,0.5)]">
            <Image
              src="/image.png"
              alt="Community feedback"
              width={373}
              height={536}
              className="h-full w-full rounded-[28px] object-cover -scale-x-100"
              priority
            />
          </div>
          {badges.map((badge) => (
            <div
              key={badge.text}
              className={`absolute ${badge.className} hidden rounded-[12px] border border-white/10 bg-[#2b2039] text-[18px] text-white font-medium shadow-[0_18px_40px_rgba(7,4,20,0.5)] lg:block`}
            >
              {badge.text}
            </div>
          ))}
          <div className="mt-4 flex flex-col items-center gap-3 lg:hidden">
            {badges.map((badge) => (
              <div
                key={badge.text}
                className="w-full rounded-[12px] border border-white/10 bg-[#2b2039] px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(7,4,20,0.5)]"
              >
                {badge.text}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full space-y-6 lg:w-[55%]">
          <h2 className="text-3xl font-semibold lg:text-5xl">
            Everything You Need to Run Community-Verified Feedback Quests
          </h2>
          <p className="text-base text-white/65">
            Create stellar products using real feedback from real community
            users.
          </p>
          <p className="text-base text-white/55">
            Quid helps Stellar creators validate ideas faster by turning their
            community into contributors. Create quests, gate access with NFTs or
            product access, collect structured feedback, and reward participants
            — all without friction.
          </p>
          <button className="h-[44px] w-[149px] rounded-[12px] border border-[#B159FF] bg-[#9011FF]  text-sm font-inter font-semibold cursor-pointer text-white shadow-[0_0_12.1px_4px_rgba(177,89,255,0.15)] transition hover:-translate-y-px">
            Create a Quest
          </button>
        </div>
      </div>
    </section>
  );
}
