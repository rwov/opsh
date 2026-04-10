import { LazyDither } from "@/components/animations/lazy-dither";
import { CompanyShowcase } from "@/components/section/company-showcase";
import { ConnectSection } from "@/components/section/connection-section";
import { CTASection } from "@/components/section/cta-section";
import { DemoSection } from "@/components/section/demo-section";
import { FAQSection } from "@/components/section/faq-section";
import { FeatureSection } from "@/components/section/feature-section";
import { Footer } from "@/components/section/footer";
import { HeroSection } from "@/components/section/hero-section";
import { PricingSection } from "@/components/section/pricing-section";
import { TestimonialSection } from "@/components/section/testimonial-section";
import { WorkflowConnectSection } from "@/components/section/workflow-connect-section";
import { WorkflowSection } from "@/components/section/workflow-section";

export default function Home() {
  return (
    <main className="flex flex-col divide-y divide-border pt-16">
      <HeroSection />
      <DemoSection />
      {/* <CompanyShowcase /> */}
      <WorkflowSection />
      <WorkflowConnectSection />
      <FeatureSection />
      <ConnectSection />
      {/* <TestimonialSection /> */}
      {/* <PricingSection /> */}
      <FAQSection />
      <CTASection />
      <Footer />
      <LazyDither />
    </main>
  );
}
