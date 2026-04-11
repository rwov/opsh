import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CTASection() {
    const { ctaSection } = siteConfig;

    return (
        <section
            id={ctaSection.id}
            className="relative flex flex-col items-center justify-center px-4 py-20 md:py-32 overflow-hidden"
        >
            <div className="absolute inset-0 -z-1 h-full w-full bg-radial-[at_45%_85%] from-[var(--hero-glow-primary)] via-[var(--hero-glow-secondary)] mask-[linear-gradient(to_bottom,transparent,black_100%)]" />
            <div className="absolute inset-0 -z-1 h-full w-full bg-radial-[at_45%_68%] from-[var(--hero-glow-primary-strong)] via-[var(--hero-glow-secondary-strong)] mask-[linear-gradient(to_bottom,transparent,black_100%)] blur-[50px]" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 max-w-4xl mx-auto">
                {/* Heading */}
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-tighter    text-balance">
                    {ctaSection.title}
                </h2>
                <p className="text-muted-foreground text-center text-balance font-medium max-w-2xl mx-auto">
                    {ctaSection.subtext}
                </p>

                {/* CTA Button */}
                <div className="pt-2">
                    <Button
                        asChild
                        size="lg"
                        className={cn(
                            "rounded-full px-8 py-6 text-base font-medium text-primary-foreground",
                            "bg-linear-to-b from-[var(--gradient-primary)] to-[var(--gradient-secondary)]",
                            "shadow-[var(--button-shadow)] ring-2 ring-primary/70 hover:brightness-105",
                        )}
                    >
                        <a href={ctaSection.button.href}>
                            {ctaSection.button.text}
                        </a>
                    </Button>
                </div>
            </div>
        </section>
    );
}
