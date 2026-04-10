import { SectionHeader } from "@/components/section-header";
import { SocialProofTestimonials } from "@/components/animations/testimonial-scroll";
import { siteConfig } from "@/lib/config";
import { HeaderBadge } from "../header-badge";

export function TestimonialSection() {
    const { testimonialSection } = siteConfig;

    return (
        <section
            id="testimonials"
            className="flex flex-col items-center justify-center w-full"
        >
            <SectionHeader>
                <div className="flex flex-col items-center justify-center">
                    <HeaderBadge icon={testimonialSection.badge.icon} text={testimonialSection.badge.text} />
                    <div className="flex flex-col items-center justify-center gap-4 mt-4">
                        <h2 className="text-3xl md:text-4xl lg:text-6xl font-medium tracking-tighter text-center text-balance">
                            {testimonialSection.title}
                        </h2>
                        <p className="text-muted-foreground md:text-lg text-center text-balance mx-auto">
                            {testimonialSection.description}
                        </p>
                    </div>
                </div>
            </SectionHeader>
            <SocialProofTestimonials testimonials={testimonialSection.testimonials} />
        </section>
    );
}
