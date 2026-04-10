"use client";

import { useRef } from "react";
import { useInView } from "motion/react";

import { siteConfig } from "@/lib/config";
import { BlurFade } from "@/components/ui/blur-fade";

const INITIAL_DELAY = 0.05;
const DELAY_INCREMENT = 0.05;

export function CompanyShowcase() {
    const { companyShowcase } = siteConfig;
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { amount: 0.8, margin: "0px 0px -20px 0px" });

    return (
        <section
            ref={sectionRef}
            id="company"
            className="relative flex w-full items-center justify-center"
        >
            <div className="grid w-full max-w-7xl grid-cols-1 items-center divide-y divide-border lg:grid-cols-6 lg:divide-y-0">
                <p className="col-span-2 inline-flex min-h-20 items-center justify-center gap-1 text-center font-medium text-muted-foreground">
                    Trusted by{" "}
                    <span className="text-primary">fast-growing</span> startups
                </p>
                <div className="col-span-4 grid grid-cols-2 gap-px overflow-hidden lg:border-l border-border md:grid-cols-4">
                    {companyShowcase.companyLogos.map((logo, idx) => (
                        <BlurFade
                            key={logo.id}
                            delay={INITIAL_DELAY + idx * DELAY_INCREMENT}
                            inView={isInView}
                            className="group relative flex h-32 w-full items-center justify-center p-4 before:absolute before:-left-1 before:top-0 before:z-10 before:h-screen before:w-px before:bg-border before:content-[''] after:absolute after:-top-1 after:left-0 after:z-10 after:h-px after:w-screen after:bg-border after:content-['']"
                        >
                            <div className="flex h-full w-full items-center justify-center p-4">
                                {logo.logo}
                            </div>
                        </BlurFade>
                    ))}
                </div>
            </div>
        </section>
    );
}
