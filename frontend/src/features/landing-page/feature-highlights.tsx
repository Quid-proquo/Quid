"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const featureItems = [
  { title: "Custom Template", icon: "/Frame 56.png" },
  { title: "Diverse Audience", icon: "/Frame 57.png" },
  { title: "Cost Efficient", icon: "/Frame 58.png" },
];

export default function FeatureHighlights() {
  return (
    <section className="relative overflow-hidden py-24 text-white">
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-6 pt-10 pb-30 text-center cursor-default md:max-w-3xl lg:max-w-5xl">
        <div className="space-y-4">
          <h2 className="font-semibold text-4xl lg:text-5xl">
            Save time, work smarter, get
            <br /> answers.
          </h2>
          <p className="max-w-2xl font-inter text-base text-center text-white/65">
            From quick user experience tests to in-depth interviews, Quid
            delivers insights with real feedback, real quick.
          </p>
        </div>

        <div className="grid w-full max-w-3xl gap-12 md:grid-cols-3">
          {featureItems.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-4 text-center"
            >
              <motion.div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 2.6,
                  repeat: Infinity,
                  ease: "easeInOut",
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
              <p className="text-base font-inter font-medium text-white/90">
                {feature.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
