"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Clock } from "lucide-react";

const opportunityCards = [
  {
    id: 1,
    title: "Web3 User Experience",
    description: "Share your experiences with decentralized applications and help improve the ecosystem..",
    time: "~15 min",
    questions: "8",
    reward: "10 XLM",
  },
  {
    id: 2,
    title: "Blockchain Usability",
    description: "Participate in user testing sessions for blockchain platforms and contribute to enhancing usability and accessibility.",
    time: "~20 min",
    questions: "12",
    reward: "15 XLM",
  },
  {
    id: 3,
    title: "AI-Powered Chatbot Feedback",
    description: "Engage with an AI chatbot and share insights on its conversational abilities and user experience.",
    time: "~10 min",
    questions: "6",
    reward: "8 XLM",
  },
  {
    id: 4,
    title: "E-Commerce Experience",
    description: "Complete a survey focused on your recent online shopping experiences to improve e-commerce platforms.",
    time: "~18 min",
    questions: "10",
    reward: "12 XLM",
  },
  {
    id: 5,
    title: "Mobile App Usability",
    description: " Test a new mobile app and provide feedback on its design and functionality in real-time.",
    time: "~15 min",
    questions: "9",
    reward: "11 XLM",
  },
  {
    id: 6,
    title: "Virtual Reality Interface",
    description: "Participate in testing a VR application and evaluate its user interface and interaction design.",
    time: "~25 min",
    questions: "14",
    reward: "18 XLM",
  },
  {
    id: 7,
    title: "Health Tracking App",
    description: "Use a health tracking app and share your thoughts on features, layout, and information clarity.",
    time: "~12 min",
    questions: "7",
    reward: "9 XLM",
  },
  {
    id: 8,
    title: "Social Media Platform Feedback",
    description: "Explore new features in a social media platform and provide constructive feedback on user engagement.",
    time: "~16 min",
    questions: "11",
    reward: "13 XLM",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  hover: {
    y: -8,
    boxShadow: "0 20px 40px rgba(144, 17, 255, 0.2)",
    transition: { duration: 0.3 },
  },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.8 },
  },
};

export default function OpportunitiesSection() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 lg:py-40 xl:py-[11.25rem] px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background gradient elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-500/15 blur-[120px]" />
        <div className="absolute -bottom-[15%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-500/10 blur-[140px]" />
      </div>

      <motion.div
        className="relative z-10 flex flex-col w-full max-w-[1400px] mx-auto items-center gap-12 md:gap-16 lg:gap-20"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Header Section */}
        <motion.div
          className="flex flex-col items-center gap-3 md:gap-4 w-full text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight"
            variants={headerVariants}
          >
            Looking to earn money taking surveys?
          </motion.h2>

          <motion.h3
            className="text-2xl sm:text-3xl md:text-4xl font-semibold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent"
            variants={headerVariants}
          >
            You&apos;ve come to the right place.
          </motion.h3>

          <motion.p
            className="max-w-2xl text-base sm:text-lg text-white/65 mt-2 md:mt-4"
            variants={headerVariants}
          >
            Discover a wide variety of surveys and feedback opportunities from leading companies. Complete tasks on your own schedule and earn rewards directly to your wallet.
          </motion.p>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          className="grid w-full gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {opportunityCards.map((card) => (
            <motion.div
              key={card.id}
              className="group relative h-full"
              variants={cardVariants}
              whileHover="hover"
            >
              {/* Card Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Card Container */}
              <div className="relative h-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm p-6 flex flex-col gap-4 hover:border-white/20 transition-colors duration-300">
                {/* Icon Background (subtle) */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <div className="relative z-10 flex-1 flex flex-col gap-3">
                  {/* Title */}
                  <motion.h4
                    className="text-lg font-bold text-white leading-snug"
                    variants={headerVariants}
                  >
                    {card.title}
                  </motion.h4>

                  {/* Description */}
                  <motion.p
                    className="text-sm text-white/60 leading-relaxed flex-1"
                    variants={headerVariants}
                  >
                    {card.description}
                  </motion.p>
                </div>

                {/* Bottom Section with Meta Data */}
                <div className="relative z-10 flex items-center justify-between gap-4 pt-3 border-t border-white/5">
                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>{card.time}</span>
                  </div>

                  {/* Questions */}
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Image
                      src="/book.svg"
                      alt="questions"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span>{card.questions} Q</span>
                  </div>

                  {/* Reward in XLM */}
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-purple-300">
                    <Image
                      src="/image 12 (1).svg"
                      alt="stellar"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                    <span>{card.reward}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button Section */}
        <motion.div
        className="relative z-10 flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.button
          className="px-8 py-3 rounded-lg border-2 border-purple-500/50 text-white font-semibold hover:border-purple-400 hover:bg-white/5 transition-all duration-300"
          whileHover={{
            scale: 1.05,
            borderColor: "rgb(192, 132, 250)",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          }}
          whileTap={{ scale: 0.95 }}
        >
          Explore Quests
        </motion.button>
      </motion.div>
      </motion.div>
    </section>
  );
}
