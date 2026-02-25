"use client";

import { motion, type Variants } from "framer-motion";
import { useState } from "react";

const steps = [
  {
    id: "1",
    number: "01",
    title: "Browse the Category",
    description: "Explore topics that matter to you and discover surveys tailored to your interests.",
    image: "/step1.jpg",
    cta: "Click here to start",
  },
  {
    id: "2",
    number: "02",
    title: "Complete the Survey",
    description: "Share your thoughts by answering quick surveys and help shape ideas, products, and decisions.",
    image: "/step2.jpg",
    cta: "Click here to start",
  },
  {
    id: "3",
    number: "03",
    title: "Get Rewarded",
    description: "Receive XLM rewards instantly",
    image: "/step3.jpg",
    cta: "Click here to start",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2,
    },
  },
};

const headerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  hover: {
    y: -12,
    transition: { duration: 0.3 },
  },
};

export const HowItWorksSection = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <motion.section
      className="relative py-16 sm:py-24 md:py-32 lg:py-40 xl:py-[11.25rem] px-4 sm:px-6 lg:px-8 overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      {/* Background gradient elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-[10%] left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-[800px] h-[800px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute -bottom-[15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/15 blur-[100px]" />
      </div>

      {/* Header Section */}
      <motion.div
        className="relative z-10 flex flex-col gap-2 sm:gap-3 max-w-[700px] w-full mx-auto text-center mb-12 md:mb-16 lg:mb-20"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.span
          className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-purple-400"
          variants={headerVariants}
        >
          How It Works
        </motion.span>

        <motion.h2
          className="font-semibold md:font-bold lg:font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white leading-tight"
          variants={headerVariants}
        >
          Have a Quest Setup in just 3 steps
        </motion.h2>
      </motion.div>

      {/* Cards Grid */}
      <motion.div
        className="relative z-10 flex max-md:flex-col gap-6 md:gap-8 items-stretch justify-center w-full max-w-6xl mx-auto mb-12 md:mb-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {steps.map((step) => {
          const isExpanded = expandedId === step.id;

          return (
            <motion.div
              key={step.id}
              className="group relative flex-1 min-h-[466px] rounded-3xl overflow-hidden cursor-pointer"
              variants={cardVariants}
              whileHover="hover"
              onMouseEnter={() => setExpandedId(step.id)}
              onMouseLeave={() => setExpandedId(null)}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{
                  backgroundImage: `url('${step.image}')`,
                  backgroundPosition: "center",
                }}
              />

              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-[#110E13] opacity-80 group-hover:opacity-70 transition-opacity duration-300" />

              {/* Content Container */}
              <div className="relative h-full flex flex-col justify-between p-8 z-10 text-white">
                {isExpanded ? (
                  <>
                    {/* Expanded Content */}
                    <div className="flex items-start justify-between">
                      <div>
                        <motion.h3
                          className="text-2xl md:text-3xl font-bold leading-tight"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {step.title}
                        </motion.h3>
                        <motion.p
                          className="text-sm text-white/70 mt-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                        >
                          {step.description}
                        </motion.p>
                      </div>

                      {/* Watermark Number */}
                      <motion.span
                        className="text-7xl md:text-8xl font-bold text-white/10 leading-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        {step.number}
                      </motion.span>
                    </div>

                    {/* Bottom Section - CTA */}
                    <motion.a
                      href="#"
                      className="text-sm text-purple-300 hover:text-purple-200 font-semibold flex items-center gap-2 transition-colors duration-300"
                      whileHover={{ x: 4 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      {step.cta}
                      <span className="text-lg">→</span>
                    </motion.a>
                  </>
                ) : (
                  <>
                    {/* Collapsed Content - Just Number */}
                    <div className="flex-1 flex items-center justify-center">
                      <motion.span
                        className="text-8xl md:text-9xl font-bold text-white/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {step.number}
                      </motion.span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Explore Quests Button */}
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
    </motion.section>
  );
};
