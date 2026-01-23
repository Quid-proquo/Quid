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

export default function FAQPage() {
  return (
    <section className="relative py-10 sm:py-24 md:py-32 lg:py-40 xl:py-[11.25rem] px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[300px] h-[600px] bg-[#9011ff] opacity-20 blur-[80px] rounded-full pointer-events-none -z-10" />

    <div className="relative flex flex-col w-full max-w-[729px] mx-auto items-center gap-16 p-2">
      <header className="flex flex-col items-center gap-5 w-full">
        <h1 className="w-full text-white tracking-[-0.02em] text-3xl md:text-[48px] text-center ">
          Common Questions From Research Teams
        </h1>

        <p className="flex items-center justify-center w-full text-[#b0b0b0] text-[16px] text-center">
          Covers all the popular inquires you may have.
        </p>
      </header>

      <Accordion
        type="single"
        collapsible
        defaultValue="item-0"
        className="flex flex-col items-start gap-4 w-full"
      >
        {faqData.map((faq, index) => (
          <AccordionItem
            key={`faq-${index}`}
            value={`item-${index}`}
            className="w-full rounded-[16px] border border-solid border-[#5e5365] px-4 py-0 data-[state=open]:pb-4"
          >
            <AccordionTrigger className="flex items-center justify-between w-full py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180 [&>svg]:w-[14px] [&>svg]:h-[14px] [&>svg]:text-white [&>svg]:opacity-50">
              <h3 className="w-fit text-white text-[16px] text-left">
                {faq.question}
              </h3>
            </AccordionTrigger>

            {faq.answer && (
              <AccordionContent className="flex flex-col gap-2.5 pt-0">
                <div className="w-full h-px bg-[#5e5365]" />
                <p className="text-[#ffffff99] text-[14px]">
                  {faq.answer}
                </p>
              </AccordionContent>
            )}
          </AccordionItem>
        ))}
      </Accordion>
    </div>
    </section>
  );
};