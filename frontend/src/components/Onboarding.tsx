'use client';

import React, { useState, useEffect } from 'react';
import {
  WelcomeIcon,
  EarnerIcon,
  JobsIcon,
  PaymentIcon,
  BusinessIcon,
  PostIcon,
  ReviewIcon,
  ProgressDots,
} from './Icons';
import './Onboarding.css';

export interface OnboardingProps {
  role: 'earner' | 'business';
  onComplete: () => void;
}

interface OnboardingStep {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const earnerSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Quid!',
    content: "You're all set as an Earner. Let's show you how to get started and find your first opportunity.",
    icon: <WelcomeIcon />,
  },
  {
    title: 'Find Jobs',
    content:
      'Browse available opportunities that match your skills. Filter by category, pay rate, and time commitment to find the perfect fit.',
    icon: <JobsIcon />,
  },
  {
    title: 'Submit Your Work',
    content: 'Complete the tasks and submit your work for review. Maintain quality to build your reputation.',
    icon: <EarnerIcon />,
  },
  {
    title: 'Get Paid Instantly',
    content: 'Receive instant payments when your work is approved. Funds go directly to your connected wallet.',
    icon: <PaymentIcon />,
  },
];

const businessSteps: OnboardingStep[] = [
  {
    title: 'Welcome to Quid!',
    content: "You're all set as a Business. Let's show you how to post jobs and manage your team.",
    icon: <WelcomeIcon />,
  },
  {
    title: 'Post Jobs',
    content: 'Create detailed job listings with clear requirements, deadlines, and payment amounts. Reach thousands of qualified Earners.',
    icon: <PostIcon />,
  },
  {
    title: 'Review Submissions',
    content: 'Evaluate submissions from Earners. Approve quality work or request revisions to ensure your standards are met.',
    icon: <ReviewIcon />,
  },
  {
    title: 'Release Payments',
    content: 'Approve work and release payments instantly. Build long-term relationships with top-performing Earners.',
    icon: <PaymentIcon />,
  },
];

export const Onboarding: React.FC<OnboardingProps> = ({ role, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps = role === 'earner' ? earnerSteps : businessSteps;
  const storageKey = `hasOnboarded_${role}`;

  useEffect(() => {
    setIsAnimating(true);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 150);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
      }, 150);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true');
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 150);
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true');
    onComplete();
  };

  if (!isVisible) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-backdrop" onClick={handleSkip} aria-hidden="true" />
      <div className={`onboarding-modal ${isAnimating ? 'animate-in' : 'animate-out'}`} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        {/* Close Button */}
        <button
          className="onboarding-close"
          onClick={handleSkip}
          aria-label="Skip onboarding"
          title="Skip onboarding"
        >
          ✕
        </button>

        {/* Content */}
        <div className="onboarding-content">
          {/* Icon */}
          <div className="onboarding-icon" aria-hidden="true">
            {currentStepData.icon}
          </div>

          {/* Title */}
          <h2 id="onboarding-title" className="onboarding-title">
            {currentStepData.title}
          </h2>

          {/* Description */}
          <p className="onboarding-description">{currentStepData.content}</p>

          {/* Progress Indicator */}
          <ProgressDots current={currentStep} total={steps.length} className="onboarding-progress" />
        </div>

        {/* Footer */}
        <div className="onboarding-footer">
          {/* Previous Button */}
          <button
            className="onboarding-button onboarding-button-secondary"
            onClick={handlePrevious}
            disabled={isFirstStep}
            aria-label={`Go to previous step ${isFirstStep ? '(disabled)' : ''}`}
          >
            Previous
          </button>

          {/* Next/Complete Button */}
          <button
            className="onboarding-button onboarding-button-primary"
            onClick={handleNext}
            aria-label={isLastStep ? `Complete onboarding on step ${currentStep + 1}` : `Go to next step (${currentStep + 2} of ${steps.length})`}
          >
            {isLastStep ? "Let's Go!" : 'Next'}
          </button>
        </div>

        {/* Step Counter */}
        <div className="onboarding-counter" aria-live="polite">
          {currentStep + 1} of {steps.length}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
