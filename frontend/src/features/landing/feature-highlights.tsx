"use client";

import Image from "next/image";
import { motion, Variants } from "framer-motion";

const featureItems = [
  { title: "Custom Template", icon: "/Frame 56.png" },
  { title: "Diverse Audience", icon: "/Frame 57.png" },
  { title: "Cost Efficient", icon: "/Frame 58.png" },
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

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  hover: {
    y: -10,
    transition: { duration: 0.3 },
  },
};

const iconVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.6, delay: 0.2 },
  },
};

export default function FeatureHighlights() {
  return (
    <section className="relative overflow-hidden py-24 text-white">
      {/* Background gradient elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-200px] top-1/3 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute right-[-200px] bottom-1/3 h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />
      </div>

      <motion.div
        className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 pt-10 pb-30 text-center cursor-default md:max-w-3xl lg:max-w-5xl"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Heading Section */}
        <motion.div
          className="space-y-4 max-w-3xl"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2
            className="font-semibold text-4xl lg:text-5xl leading-tight"
            variants={headingVariants}
          >
            Save time, work smarter, get{" "}
            <motion.span
              className="inline-block bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              answers.
            </motion.span>
          </motion.h2>
          <motion.p
            className="max-w-2xl font-inter text-base text-center text-white/65 mx-auto"
            variants={headingVariants}
          >
            From quick user experience tests to in-depth interviews, Quid
            delivers insights with real feedback, real quick.
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid w-full max-w-3xl gap-12 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {featureItems.map((feature, idx) => (
            <motion.div
              key={feature.title}
              className="flex flex-col items-center gap-4 text-center cursor-pointer"
              variants={itemVariants}
              whileHover="hover"
            >
              {/* Icon Container with background glow */}
              <motion.div
                className="relative flex h-24 w-24 items-center justify-center"
                variants={iconVariants}
              >
                {/* Background glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.7, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: idx * 0.5,
                  }}
                />

                {/* Icon */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: idx * 0.2,
                  }}
                >
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={96}
                    height={96}
                    className="h-24 w-24 object-contain"
                  />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.p
                className="text-base font-inter font-medium text-white/90"
                variants={headingVariants}
              >
                {feature.title}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
