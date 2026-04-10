"use client";

import { useState } from "react";

import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SwitchContainer, SwitchItem } from "@/components/animations/animated-switch";
import { LazyDither } from "@/components/animations/lazy-dither";

type BillingPeriod = "monthly" | "annually";

export function PricingSection() {
    const { pricing } = siteConfig;
    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
    const isYearly = billingPeriod === "annually";

    const paidPlans = pricing.pricingItems
        .filter((plan) => plan.name !== "Free")
        .sort((a, b) => {
            if (a.name === "Startup") return -1;
            if (b.name === "Startup") return 1;
            return 0;
        });

    const freePlan = pricing.pricingItems.find((plan) => plan.name === "Free");

    return (
        <section id="pricing" className="relative w-full border-b">
            <div className="mx-auto">
                <div className="grid divide-x divide-border md:grid-cols-6">
                    <div className="col-span-2 flex flex-col gap-4 p-8 md:p-14">
                        <div className="space-y-4">
                            <h3 className="text-3xl font-medium tracking-tighter md:text-4xl">
                                Build more. Pay less. Scale smart.
                            </h3>
                            <p className="text-balance text-muted-foreground">
                                Try free for 14 days with full access to all
                                features. Upgrade only when your AI agent proves
                                value.
                            </p>
                        </div>
                        <div className="pt-4">
                            <SwitchContainer
                                value={billingPeriod}
                                onValueChange={(value) =>
                                    setBillingPeriod(value as BillingPeriod)
                                }
                                className="rounded-xl"
                            >
                                <SwitchItem value="monthly" label="Monthly" />
                                <SwitchItem
                                    value="annually"
                                    label="Annually"
                                />
                            </SwitchContainer>
                        </div>
                    </div>

                    <div className="col-span-4 flex flex-col">
                        <div className="relative h-14 border-b overflow-hidden">
                            <div className="absolute inset-0">
                                <LazyDither enableMouseInteraction={false} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 items-stretch gap-6 border-b md:grid-cols-2">
                            {paidPlans.map((plan) => {
                                const displayPrice = isYearly
                                    ? plan.yearlyPrice
                                    : plan.price;
                                const pricePeriod = isYearly
                                    ? "year"
                                    : plan.period;

                                return (
                                    <div
                                        key={plan.name}
                                        className={cn(
                                            "grid h-full gap-8 p-6",
                                            plan.name === "Startup" &&
                                            "border-b bg-card/50 md:border-b-0 md:border-r",
                                            plan.name === "Enterprise" &&
                                            "border-t bg-accent md:border-t-0 md:border-l",
                                        )}
                                    >
                                        <div className="grid gap-8">
                                            <div className="flex flex-col gap-8">
                                                <h4 className="flex items-center gap-2 text-xl font-medium">
                                                    {plan.name}
                                                    {plan.isPopular && (
                                                        <span className="rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                                            Popular
                                                        </span>
                                                    )}
                                                </h4>
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-3xl font-medium md:text-4xl">
                                                            {displayPrice}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            /{pricePeriod}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {plan.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="lg"
                                                asChild
                                                variant="outline"
                                                className={cn(
                                                    "w-full cursor-pointer rounded-full transition-all duration-300 ease-in-out",
                                                    plan.name === "Startup"
                                                        ? "bg-primary text-primary-foreground hover:bg-primary/80 hover:scale-[1.02]"
                                                        : "bg-foreground text-primary-foreground hover:bg-foreground/80 hover:scale-[1.02]",
                                                )}
                                            >
                                                <a href={plan.href}>
                                                    {plan.buttonText}
                                                </a>
                                            </Button>
                                        </div>
                                        <hr className="border-dashed border-border" />
                                        <div className="flex flex-1 flex-col gap-4">
                                            {plan.name === "Startup" && (
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Everything in Free +
                                                </p>
                                            )}
                                            {plan.name === "Enterprise" && (
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    Everything in Startup +
                                                </p>
                                            )}
                                            <ul className="space-y-2">
                                                {plan.features.map(
                                                    (feature, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <svg
                                                                className="mt-0.5 h-5 w-5 shrink-0 text-secondary-foreground"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                            <span className="text-sm text-secondary-foreground">
                                                                {feature}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {freePlan && (
                            <div className="mt-6">
                                <div className="grid grid-cols-1 border-t md:grid-cols-5">
                                    <div className="col-span-3 p-6 md:p-8">
                                        <h4 className="mb-8 text-xl font-medium">
                                            {freePlan.name}
                                        </h4>
                                        <div className="mb-2 flex items-baseline gap-2">
                                            <span className="text-3xl font-medium md:text-4xl">
                                                {isYearly
                                                    ? freePlan.yearlyPrice
                                                    : freePlan.price}
                                            </span>
                                            <span className="text-muted-foreground">
                                                /{isYearly ? "year" : freePlan.period}
                                            </span>
                                        </div>
                                        <p className="mb-6 text-sm text-muted-foreground">
                                            {freePlan.description}
                                        </p>
                                        <Button
                                            asChild
                                            variant="outline"
                                            className={cn(
                                                "w-full rounded-full border border-border bg-card text-secondary-foreground transition-all duration-300 ease-in-out hover:bg-accent hover:scale-[1.02]",
                                                freePlan.buttonColor,
                                            )}
                                        >
                                            <a
                                                href={freePlan.href}
                                                className="w-full text-secondary-foreground"
                                            >
                                                {freePlan.buttonText}
                                            </a>
                                        </Button>
                                    </div>
                                    <div className="col-span-2 flex w-full flex-col items-start justify-start gap-4 p-6 md:p-8">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Get Started today:
                                        </p>
                                        <ul className="flex flex-col items-start gap-2">
                                            {freePlan.features.map(
                                                (feature, idx) => (
                                                    <li
                                                        key={idx}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <svg
                                                            className="mt-0.5 h-5 w-5 shrink-0 text-secondary-foreground"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                        <span className="text-sm text-secondary-foreground">
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative h-14 border-t overflow-hidden">
                            <div className="absolute inset-0">
                                <LazyDither enableMouseInteraction={false} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}