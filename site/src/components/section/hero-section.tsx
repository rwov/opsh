import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CornerPlus } from "@/components/ui/corner-plus";
import { HeaderBadge } from "@/components/header-badge";

export function HeroSection() {
    const { hero } = siteConfig;

    return (

        <section
            id="hero"
            className="relative flex flex-col items-center justify-center px-4 py-16 md:py-24"
        >
            <CornerPlus position="bottom-left"  className="text-muted-foreground/50"/>
            <CornerPlus position="bottom-right" className="text-muted-foreground/50"/>
            <div className="absolute inset-0 -z-1 h-full w-full bg-radial-[at_45%_85%] from-[#2CD5FF]/40 via-[#2C30FF]/4 mask-[linear-gradient(to_bottom,transparent,black_100%)]" />
            <div className="absolute inset-0 -z-1 h-full w-full bg-radial-[at_45%_68%] from-[#2CD5FF]/68 via-[#2C30FF]/3 mask-[linear-gradient(to_bottom,transparent,black_100%)] blur-[50px]" />
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 max-w-4xl mx-auto">
                <HeaderBadge icon={hero.badgeIcon} text={hero.badge} className="max-[350px]:hidden" />
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter text-balance">
                    {hero.title}
                </h1>
                <p className="text-secondary-foreground/70 text-center text-balance text-lg max-w-2xl mx-auto">
                    {hero.description}
                </p>
                <Button
                    asChild
                    size="lg"
                    className={cn(
                        "rounded-full px-8 py-6 text-base font-medium text-primary-foreground",
                        "bg-linear-to-b from-sky-500 to-sky-600",
                        "shadow-[0px_1px_2px_0px_#00000016,0px_2px_4px_0px_#00000006,inset_0px_0px_1.5px_#0084D1,inset_0px_2.5px_0px_#ffffff16,inset_0px_0px_2.5px_#ffffff08]",
                        "ring-2 ring-sky-600 hover:from-sky-600 hover:to-sky-700",
                    )}
                >
                    <a href={hero.cta.primary.href}>
                        {hero.cta.primary.text}
                    </a>
                </Button>
            </div>
        </section>
    );
}