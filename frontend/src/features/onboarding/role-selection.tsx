"use client";
import Link from "next/link";
import { useState } from "react";

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const boxContent = [
    {
      icon: "/role-selection/building-icon.png",
      title: "Create surveys & get insights",
      description:
        "Launch research projects and collect quality responses from engaged participants",
      benefits: [
        "Access to 500k+ survey participants ",
        "Advanced analytics and reporting",
        "Real-time response monitoring",
        "Enterprise-grade security",
      ],
    },
    {
      icon: "/role-selection/cash-icon.png",
      title: "Take surveys % earn money",
      description:
        "Share your opinions with brands and get rewarded for your valuable feedback",
      benefits: [
        " Earn money for each completed survey",
        "Flexible schedule - work anytime",
        "Fair compensation for your time",
        "Instant payments via blockchain",
      ],
    },
  ];
  return (
    <div className="bg-gray-50 dark:bg-[#121015] min-h-screen relative overflow-hidden selection:bg-purple-500/30">
      {/* BAckgound blob*/}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 flex items-center justify-center  select-none z-0 inset-0  pointer-events-none">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full fill-purple-700/20 blur-[120px] -rotate-12 -z-10"
        >
          <path d="M50 0 C22.4 0 0 22.4 0 50 C0 77.6 22.4 100 50 100 C60 100 69 97 77 92 L85 100 L92 92 L84 84 C94 75 100 63 100 50 C100 22.4 77.6 0 50 0 Z M50 80 C33.4 80 20 66.6 20 50 C20 33.4 33.4 20 50 20 C66.6 20 80 33.4 80 50 C80 66.6 66.6 80 50 80 Z" />
        </svg>
      </div>
      {/* Main content  */}
      <div className="relative z-10  flex flex-col justify-center items-center lg:py-24 py-6 m-auto font-inter lg:px-auto px-5">
        <svg
          className="size-24"
          viewBox="0 0 85 49"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M6.42928 37.6266L10.3292 43.2301H6.69637C2.99812 43.2301 0 40.2522 0 36.5793V12.4702H5.02228V34.9166C5.02228 36.0345 5.57772 37.0234 6.42928 37.6266Z"
            fill="#9011FF"
            className="fill-[#9011FF]"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M18.415 43.0206C21.3032 42.2826 23.4373 39.6782 23.4373 36.5793V6.65078C23.4373 2.97791 20.4392 0 16.7409 0H6.69637C2.99812 0 0 2.97791 0 6.65078V9.14483H5.02228V8.31348C5.02228 6.47704 6.52124 4.98809 8.37047 4.98809H15.0668C16.9161 4.98809 18.415 6.47704 18.415 8.31348V34.9166C18.415 36.753 16.9161 38.242 15.0668 38.242H10.928L18.415 49V43.0206Z"
            fill="#9011FF "
            className="fill-[#9011FF]"
          />
          <path
            d="M44.8858 16.4393H48.2072V42.8828H45.3679L45.2608 38.2538C43.9215 41.6058 41.0287 43.4148 37.0109 43.4148C31.9216 43.4148 29.2966 40.4353 29.2966 34.689V16.4393H32.618V34.2101C32.618 38.4666 34.3323 40.5417 37.868 40.5417C42.3144 40.5417 44.8858 37.5089 44.8858 32.3479V16.4393Z"
            fill="white"
            className="dark:fill-white fill-gray-900"
          />
          <path
            d="M55.3573 11.3847V5.58517H58.6786V11.3847H55.3573ZM55.3037 42.8828V16.4393H58.6251V42.8828H55.3037Z"
            fill="white"
            className="dark:fill-white fill-gray-900"
          />
          <path
            d="M85 42.8828H81.9465C81.625 42.0847 81.4643 40.4885 81.4107 38.3602C80.0179 41.6058 77.1251 43.4148 73.0537 43.4148C67.8037 43.4148 65.1787 40.4353 65.1787 34.7422V24.633C65.1787 18.8867 67.8037 15.9072 73.0537 15.9072C76.8036 15.9072 79.5893 17.4502 81.0893 20.2701V5.63838H84.4107V35.8595C84.4107 39.0519 84.5714 41.393 85 42.8828ZM73.9108 40.5417C78.4643 40.5417 81.0893 37.5089 81.0893 32.3479V26.9741C81.0893 21.8131 78.4643 18.7803 73.9108 18.7803C70.2144 18.7803 68.5001 20.8554 68.5001 25.1119V34.2101C68.5001 38.4666 70.2144 40.5417 73.9108 40.5417Z"
            fill="white"
            className="dark:fill-white fill-gray-900"
          />
        </svg>

        {/* Choose Account Texts  */}
        <div className="flex flex-col gap-3 items-center justify-center py-4 pt-8">
          <h1 className="lg:text-3xl text-xl text-gray-900 dark:text-white font-semibold transition-colors">
            Account Type Selection
          </h1>
          <p className="text-gray-500 dark:text-[#71717A] text-sm transition-colors">
            Choose an account to get started.
          </p>
        </div>

        {/* Select boxes  */}
        <div className="flex justify-center items-center gap-5 md:flex-row flex-col pt-4">
          {/*box  */}
          {boxContent.map((box) => (
            <div
              className={`dark:hover:border-[#9011FF] border-transparent dark:hover:shadow-none ${selectedRole === box.title ? "border-[#9011FF] ring-1 ring-purple-600 " : "border-[#332046]"} dark:border-[#332046] border rounded-lg p-4 cursor-pointer hover:border-[#9011FF] md:max-w-sm dark:bg-[#0E0E0E54] bg-white`}
              key={box.title}
              onClick={() => setSelectedRole(box.title)}
            >
              <div className="flex justify-normal items-center gap-2">
                <img src={box.icon} className="size-10" />
                <h3 className="lg:text-xl text-lg text-gray-900 dark:text-white font-medium capitalize transition-colors">
                  {box.title}
                </h3>
              </div>
              <p className="text-gray-500 dark:text-[#71717A] py-4 transition-colors">
                {box.description}
              </p>
              <div className="bg-neutral-100 dark:bg-[#1B181E] transition-colors rounded-xl p-3">
                <p className="text-gray-500 dark:text-[#71717A] pb-2">
                  Key Benefits
                </p>
                <ul className="text-gray-600 dark:text-[#B0B0B0]">
                  {box.benefits.map((benefit) => (
                    <li className="list-disc ml-6" key={benefit}>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <button
          className="bg-[#9011FF] py-2.5 rounded-xl px-24 mt-20 text-white cursor-pointer mb-12 lg:mb-auto disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#9011FF]/70"
          disabled={selectedRole === null}
        >
          <Link href={"/dashboard"}> Continue</Link>
        </button>
      </div>
    </div>
  );
};

export default RoleSelection;
