"use client";

import { motion, Variants } from "framer-motion";

const businessTags = [
  "Product design",
  "Market Strategy",
  "Brand Perception",
  "Market Research",
  "Competition Analysis",
  "Event Plan",
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const labelVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const tagVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
  hover: {
    scale: 1.05,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    transition: { duration: 0.2 },
  },
};

const ctaVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.8 },
  },
};

export default function BusinessCTASection() {
  return (
    <section className="relative w-full min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/CTA background.jpg')",
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#110E13] opacity-80" />

      {/* Content Container */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24 md:py-32 gap-8 md:gap-10 text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Section Label */}
        <motion.span
          className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-purple-400"
          variants={labelVariants}
        >
          Business
        </motion.span>

        {/* Main Heading */}
        <motion.h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl"
          variants={headingVariants}
        >
          Are you looking for user insights on your product?
        </motion.h2>

        {/* Tag Cloud */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-4 md:mt-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {businessTags.map((tag) => (
            <motion.div
              key={tag}
              className="px-4 md:px-5 py-2 md:py-2.5 rounded-full border border-white/20 bg-white/8 backdrop-blur-md hover:border-white/30 transition-all duration-300 cursor-pointer"
              variants={tagVariants}
              whileHover="hover"
            >
              <span className="text-sm md:text-base font-medium text-white">
                {tag}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Link */}
        <motion.a
          href="#"
          className="mt-8 md:mt-12 text-base md:text-lg text-purple-300 hover:text-purple-200 font-semibold flex items-center gap-2 transition-colors duration-300 group"
          variants={ctaVariants}
          whileHover={{ x: 6 }}
        >
          Create a quest now
          <motion.span
            className="text-xl"
            whileHover={{ x: 3 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.span>
        </motion.a>
      </motion.div>
    </section>
  );
}
