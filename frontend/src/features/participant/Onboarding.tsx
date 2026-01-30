import React, { useState } from "react";
// Assuming you are using shadcn/ui or similar, keep these imports.
// If not, standard HTML elements work with these classes too.
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

type UserType = "earner" | "creator";

interface StepContent {
  title: string;
  description: string;
}

const onboardingContent: Record<UserType, StepContent[]> = {
  earner: [
    {
      title: "Find a Quest",
      description: "The Quest feed is where you'll find all available opportunities. You can search and filter to find quests that match your interests.",
    },
    {
      title: "Share Your Opinion",
      description: "Answer questions and provide feedback on products and services. Your honest insights help creators improve their work.",
    },
    {
      title: "Earn Crypto Rewards",
      description: "Get paid instantly in cryptocurrency for every response you submit. The more detailed your feedback, the more you earn.",
    },
  ],
  creator: [
    {
      title: "Submit Quality Feedbacks",
      description: "Read the Quest detail carefully. Provide detailed constructive feedbacks to ensure your submission gets approved.",
    },
    {
      title: "Create Questions",
      description: "Post questions to gather insights from our community of earners. Target specific demographics and get quality responses.",
    },
    {
      title: "Ready to Launch!",
      description: "You're all set to create your first question and start collecting valuable feedback from your target audience.",
    },
  ],
};

interface FrameProps {
  userType?: UserType;
}

export const Frame = ({ userType = "earner" }: FrameProps): React.ReactElement => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = onboardingContent[userType];
  const currentContent = steps[currentStep];
  const totalSteps = steps.length;

  // Handle transition logic
  const changeStep = (direction: "next" | "back") => {
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentStep((prev) => {
        if (direction === "next") return Math.min(prev + 1, totalSteps - 1);
        return Math.max(prev - 1, 0);
      });
      setIsAnimating(false);
    }, 300); // Duration matches CSS transition
  };

  return (
    <Card className="flex w-full max-w-[784px] flex-col overflow-hidden rounded-xl border-none bg-[#0B0B15] shadow-2xl">
      <CardContent className="flex h-full flex-col p-0">
        
        {/* Header / Image Section */}
        {/* Replace bg-purple-900 with your actual image url or wave pattern */}
        <div className="relative flex h-[300px] w-full flex-col items-center justify-center bg-purple-900 bg-[url('/wave-image.png')] bg-cover bg-center text-center p-6">
          <div className="absolute inset-0 bg-black/20" />
          
          <h1
            className={`
              relative z-10 text-4xl font-bold text-white transition-all duration-500 transform
              ${isAnimating ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"}
            `}
          >
            {currentContent.title}
          </h1>
        </div>

        {/* Body Section */}
        <div className="flex flex-col px-10 py-8 min-h-[220px]">
          {/* Description Text */}
          <div className="flex-1 flex items-center justify-center">
            <p
              className={`
                max-w-lg text-center text-lg text-gray-300 leading-relaxed transition-all duration-500
                ${isAnimating ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"}
              `}
            >
              {currentContent.description}
            </p>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 flex w-full items-center justify-between">
            {/* Primary Button (Left Aligned) */}
            <Button
              onClick={() => changeStep("next")}
              disabled={currentStep === totalSteps - 1}
              className="h-12 w-32 rounded-lg bg-[#8B5CF6] text-base font-semibold text-white hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {currentStep === totalSteps - 1 ? "Start" : "Next"}
            </Button>

            {/* Pagination Dots (Right Aligned) */}
            <div className="flex items-center gap-3">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`
                    rounded-full transition-all duration-300
                    ${index === currentStep ? "h-3 w-3 bg-[#8B5CF6]" : "h-2 w-2 bg-gray-700"}
                  `}
                />
              ))}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};