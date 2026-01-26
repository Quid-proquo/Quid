import FeatureHighlights from "@/features/landing-page/feature-highlights";
import HeroSection from "@/features/landing-page/hero-section";
import MoreFeatures from "@/features/landing-page/more-features";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0a11] text-white">
      <main className="relative">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(75%_120%_at_50%_-5%,rgba(124,44,255,0.45)_0%,rgba(12,10,20,0.2)_55%,rgba(8,8,12,0.96)_100%)]" />
        </div>
        <HeroSection />
        <FeatureHighlights />
        <MoreFeatures />
      </main>
    </div>
  );
}
