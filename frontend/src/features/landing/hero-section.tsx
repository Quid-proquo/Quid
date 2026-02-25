"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, Variants } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const heroStats = [
  {
    value: "2.5k+",
    label: "Quests Completed",
  },
  { value: "120k+", label: "Verified Participants" },
  { value: "1.2M+", label: "Rewards Distributed" },
];

const cardSlides = [
  {
    title: "Download and test the latest Ruze.stellar 2.0",
    description:
      "Share your experiences with decentralized applications and help improve the ecosystem.",
    time: "~10 minutes",
    questions: "12",
    cta: "Take Quest",
    reward: "10 XLM",
  },
  {
    title: "Get community-verified insights fast",
    description:
      "Launch a gated survey and see verified responses from real Stellar users.",
    time: "~6 minutes",
    questions: "8",
    cta: "Create Quest",
    reward: "2.5k views",
  },
  {
    title: "Collect feedback on your next release",
    description:
      "Invite contributors, reward them, and ship with confidence in your roadmap.",
    time: "~14 minutes",
    questions: "16",
    cta: "Start Quest",
    reward: "24 XLM",
  },
];

// Animation variants
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

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
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

const statVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export default function HeroSection() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeSlide = useMemo(() => cardSlides[activeIndex], [activeIndex]);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const intervalId = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cardSlides.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [reduceMotion]);

  return (
    <section className="relative overflow-hidden pb-16 pt-8 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-220px] top-[8%] h-[540px] w-[540px] rounded-full bg-indigo-500/40 blur-[170px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-6 md:max-w-3xl lg:max-w-7xl">
        {/* Navigation */}
        <motion.nav
          className="flex w-full items-center justify-between pt-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <Image
              src="/Quid Logo.png"
              alt="Quid Logo"
              width={28}
              height={28}
              className="h-7 w-12 mr-2"
              priority
            />
            <div className="hidden lg:block lg:w-0.5 lg:h-6 lg:position-absolute lg:text-white lg:bg-white"></div>
            <div className="hidden items-center gap-8 text-sm text-white/70 ml-2 md:flex">
              <motion.span
                className="cursor-pointer text-white text-[1rem] fw-[700] hover:text-purple-400 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                For Builders
              </motion.span>
              <motion.span
                className="cursor-pointer text-white text-[1rem] fw-[700] hover:text-purple-400 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                For Contributors
              </motion.span>
              <motion.span
                className="cursor-pointer text-white text-[1rem] fw-[700] hover:text-purple-400 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                About
              </motion.span>
              <motion.span
                className="cursor-pointer text-white text-[1rem] fw-[700] hover:text-purple-400 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Contact us
              </motion.span>
            </div>
          </div>

          <motion.button
            className="hidden bg-[#9011FF] rounded-[12px] px-7 py-3 text-lg font-semibold shadow-lg shadow-violet-500/30 cursor-pointer md:inline-flex hover:bg-purple-700 transition-colors"
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(144, 17, 255, 0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            Connect
          </motion.button>

          <motion.button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white md:hidden hover:border-white/40 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="sr-only">Open menu</span>
            <span className="flex flex-col gap-1">
              <span className="h-[2px] w-5 rounded-full bg-white" />
              <span className="h-[2px] w-5 rounded-full bg-white" />
              <span className="h-[2px] w-5 rounded-full bg-white" />
            </span>
          </motion.button>
        </motion.nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside
                className="fixed right-4 top-4 z-50 w-[280px] rounded-3xl border border-white/20 bg-white/10 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Menu</div>
                  <motion.button
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-full border border-white/20 p-2 text-white hover:border-white/40 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✕
                  </motion.button>
                </div>
                <div className="mt-6 flex flex-col gap-4 text-sm text-white/80">
                  <motion.span
                    className="cursor-pointer hover:text-white transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    For Builders
                  </motion.span>
                  <motion.span
                    className="cursor-pointer hover:text-white transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    For Contributors
                  </motion.span>
                  <motion.span
                    className="cursor-pointer hover:text-white transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    About
                  </motion.span>
                  <motion.span
                    className="cursor-pointer hover:text-white transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    Contact us
                  </motion.span>
                </div>
                <motion.button
                  className="mt-6 h-[44px] w-full rounded-[12px] border border-[#B159FF] bg-[#9011FF] px-6 py-[14px] text-sm font-semibold text-white shadow-[0_0_12.1px_4px_rgba(177,89,255,0.15)] hover:bg-purple-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Connect
                </motion.button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex flex-col gap-16 lg:my-[100px] lg:flex-row lg:items-center lg:justify-between">
          {/* Left Side */}
          <motion.div
            className="flex w-full flex-1 flex-col gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="space-y-6 cursor-default" variants={itemVariants}>
              <motion.h1
                className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-[56px]"
                variants={headingVariants}
              >
                Launch Better Stellar Products With Real User Insight
              </motion.h1>
              <motion.p
                className="max-w-xl font-inter text-base text-white/70 sm:text-lg"
                variants={itemVariants}
              >
                Quid lets Stellar builders create gated feedback quests where
                real community members test early products, complete surveys,
                and earn rewards — all verified on-chain.
              </motion.p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-wrap items-center gap-4"
              variants={itemVariants}
            >
              <motion.button
                className="h-[44px] w-[149px] rounded-[12px] border border-[#B159FF] bg-[#9011FF] text-sm font-inter font-semibold cursor-pointer text-white shadow-[0_0_12.1px_4px_rgba(177,89,255,0.15)] transition"
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 20px rgba(144, 17, 255, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                Create a Quest
              </motion.button>
              <motion.button
                className="flex h-[44px] w-[158px] items-center justify-center gap-2 rounded-[12px] border border-[#E8E0E0] px-4 py-[14px] text-sm font-inter font-semibold cursor-pointer text-white/90 transition hover:border-white/60 hover:text-white"
                whileHover={{ scale: 1.05, borderColor: "rgba(255, 255, 255, 0.6)" }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Quests
                <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
                  <Image
                    src="/Arrow - Right.png"
                    alt="arrowright"
                    width={10}
                    height={10}
                    className="h-2 w-3"
                    priority
                  />
                </motion.div>
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="flex flex-wrap gap-10 my-[50px]"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {heroStats.map((stat) => (
                <motion.div key={stat.value} className="space-y-2" variants={statVariants}>
                  <p className="font-geist text-[32px] font-bold leading-[120%] text-white">
                    {stat.value}
                  </p>
                  <p className="font-inter text-sm font-normal leading-[130%] text-[#949494]">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Card Carousel */}
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full max-w-[456px] flex-1 md:mx-auto lg:mx-0"
          >
            <div
              className="h-full w-full rounded-[9.82px] border-[1.23px] border-[#2B1627] bg-[#0F0D0F] p-[29.45px] shadow-[0_4.91px_7.36px_-4.91px_rgba(0,0,0,0.1),0_12.27px_18.41px_-3.68px_rgba(0,0,0,0.1)] lg:h-[433.4px]"
              aria-live="polite"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.5 }}
                  className="flex h-full flex-col justify-between gap-[73.63px]"
                >
                  <div className="space-y-4 cursor-default">
                    <h3 className="font-geist text-[29.45px] font-bold leading-[39.27px] text-[#EFEFEF]">
                      {activeSlide.title}
                    </h3>
                    <p className="font-geist text-[19.63px] font-normal leading-[29.45px] text-[#71717A]">
                      {activeSlide.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-between text-xs text-white/60">
                    <div className="flex items-center justify-between w-full text-[1rem] mb-4">
                      <span>Time: {activeSlide.time}</span>
                      <span>Questions: {activeSlide.questions}</span>
                    </div>
                    <motion.button
                      className="flex h-[65.27px] w-full items-center justify-between rounded-[7.36px] border-2 border-[#9011FF] bg-[#18181B] px-[19.63px] font-geist text-[19.63px] font-bold leading-[100%] text-[#FAFAFA] cursor-pointer hover:bg-purple-900/20 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span>{activeSlide.cta}</span>
                      <span className="text-sm font-semibold text-white">
                        {activeSlide.reward}
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel Indicators */}
            <motion.div
              className="flex justify-center gap-2 mt-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {cardSlides.map((_, idx) => (
                <motion.button
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === activeIndex ? "bg-purple-500 w-8" : "bg-white/20 w-2"
                  }`}
                  onClick={() => setActiveIndex(idx)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </motion.div>

            <div className="absolute -right-10 -top-8 h-24 w-24 rounded-full bg-violet-500/40 blur-[60px]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
