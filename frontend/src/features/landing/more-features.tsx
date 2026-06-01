"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const badgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.15 },
  }),
};

export default function MoreFeatures() {
  return (
    <section className="relative overflow-hidden pb-24 pt-12 text-white">
      {/* Background gradient elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-150px] top-1/2 h-[600px] w-[600px] rounded-full bg-indigo-500/15 blur-[140px]" />
        <div className="absolute left-[-150px] bottom-0 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 md:max-w-3xl lg:max-w-6xl lg:flex-row lg:items-center">
        {/* Left Side - Image with Badges */}
        <motion.div
          className="relative w-full md:flex md:justify-center md:items-center lg:w-[45%]"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Image Container */}
          <motion.div
            className="relative mx-auto h-[536px] w-full max-w-[373px] overflow-hidden rounded-3xl p-3 shadow-[0_30px_80px_rgba(11,6,30,0.5)] group"
            variants={imageVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {/* Image glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />

            <Image
              src="/image.png"
              alt="Community feedback"
              width={373}
              height={536}
              className="h-full w-full rounded-[28px] object-cover -scale-x-100"
              priority
            />
          </motion.div>

          {/* Desktop Badges */}
          <motion.div
            className="hidden lg:block"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {badges.map((badge, idx) => (
              <motion.div
                key={badge.text}
                custom={idx}
                variants={badgeVariants}
                className={`absolute ${badge.className} rounded-[12px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl text-[18px] text-white font-medium shadow-[0_18px_40px_rgba(7,4,20,0.5)] hover:border-white/20 hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 transition-all duration-300 cursor-pointer`}
              >
                {badge.text}
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile Badges */}
          <motion.div
            className="mt-4 flex flex-col items-center gap-3 lg:hidden"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {badges.map((badge, idx) => (
              <motion.div
                key={badge.text}
                custom={idx}
                variants={badgeVariants}
                className="w-full rounded-[12px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(7,4,20,0.5)] hover:border-white/20 transition-all duration-300"
              >
                {badge.text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side - Content */}
        <motion.div
          className="w-full space-y-6 lg:w-[55%]"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2
            className="text-3xl font-semibold lg:text-5xl leading-tight"
            variants={headingVariants}
          >
            Everything You Need to Run Community-Verified Feedback Quests
          </motion.h2>

          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.p
              className="text-base text-white/65"
              variants={headingVariants}
            >
              Create stellar products using real feedback from real community
              users.
            </motion.p>
            <motion.p
              className="text-base text-white/55"
              variants={headingVariants}
            >
              Quid helps Stellar creators validate ideas faster by turning their
              community into contributors. Create quests, gate access with NFTs or
              product access, collect structured feedback, and reward participants
              — all without friction.
            </motion.p>
          </motion.div>

          <motion.button
            className="h-[44px] w-[149px] rounded-[12px] border border-[#B159FF] bg-[#9011FF] text-sm font-inter font-semibold cursor-pointer text-white shadow-[0_0_12.1px_4px_rgba(177,89,255,0.15)] transition"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 20px rgba(144, 17, 255, 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
            variants={headingVariants}
          >
            Create a Quest
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
