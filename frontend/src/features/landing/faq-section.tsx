"use client";

import { motion, Variants } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";

const faqData = [
  {
    question: "How do you ensure response quality?",
    answer:
      "We use multi-layer verification, attention checks, and quality scoring. Plus, our fair reward system motivates thoughtful participation from genuine users.",
  },
  {
    question: "Can I target specific demographics?",
    answer: "Yes, our platform offers advanced targeting options. You can filter respondents by age, location, profession, interests, and more to ensure you reach the exact audience relevant to your research.",
  },
  {
    question: "How quickly will I get responses?",
    answer: "Response times vary by target audience size, but most campaigns start seeing results within minutes. Many users complete their data collection goals in under 24 hours.",
  },
  {
    question: "How much do I pay per Quest?",
    answer: "You have full control over your budget. Pricing is based on the number of responses you need and the complexity of your survey. You only pay for high-quality, verified responses.",
  },
  {
    question: "What about data security and compliance?",
    answer: "We take data security seriously. All data is encrypted in transit and at rest. We are fully compliant with GDPR and other major privacy regulations to protect both you and your respondents.",
  },
  {
    question: "How does it work?",
    answer: "It's simple: Create your survey or task, set your target audience and budget, and launch. Our network of verified users will complete your quest, and you'll receive clean, actionable data in real-time.",
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

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function FAQSection() {
  return (
    <motion.section
      className="relative py-10 sm:py-24 md:py-32 lg:py-40 xl:py-[11.25rem] px-4 sm:px-6 lg:px-8 overflow-hidden"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      {/* Background gradient elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[300px] h-[600px] bg-[#9011ff] opacity-15 blur-[80px] rounded-full" />
        <div className="absolute top-1/3 right-[-5%] w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full" />
      </div>

      <motion.div
        className="relative flex flex-col w-full max-w-3xl mx-auto items-center gap-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {/* Header */}
        <motion.header
          className="flex flex-col items-center gap-5 w-full text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h1
            className="w-full text-white tracking-[-0.02em] text-3xl md:text-[48px] font-semibold"
            variants={headerVariants}
          >
            Common Questions From Research Teams
          </motion.h1>

          <motion.p
            className="w-full text-[#b0b0b0] text-[16px]"
            variants={headerVariants}
          >
            Covers all the popular inquiries you may have.
          </motion.p>
        </motion.header>

        {/* Accordion */}
        <motion.div
          className="w-full"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Accordion
            type="single"
            collapsible
            defaultValue="item-0"
            className="flex flex-col gap-3 w-full"
          >
            {faqData.map((faq, index) => (
              <motion.div
                key={`faq-${index}`}
                className="w-full"
                variants={itemVariants}
                whileHover={{ y: -2 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="w-full rounded-[12px] border border-white/15 px-6 py-0 data-[state=open]:pb-4 hover:border-white/25 transition-all duration-300 bg-white/[0.03] hover:bg-white/[0.06]"
                >
                  <AccordionTrigger className="flex items-center justify-between w-full py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180 [&>svg]:w-[18px] [&>svg]:h-[18px] [&>svg]:text-purple-400 [&>svg]:opacity-70 transition-transform duration-300">
                    <h3 className="text-white text-base md:text-lg text-left font-bold">
                      {faq.question}
                    </h3>
                  </AccordionTrigger>

                  {faq.answer && (
                    <AccordionContent className="flex flex-col gap-3 pt-0 pb-4">
                      <motion.div
                        className="w-full h-px bg-white/10"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <motion.p
                        className="text-gray-400 text-sm md:text-base leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        {faq.answer}
                      </motion.p>
                    </AccordionContent>
                  )}
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
