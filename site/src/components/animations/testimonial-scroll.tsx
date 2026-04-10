/* eslint-disable @next/next/no-img-element */
import { Marquee } from "@/components/ui/marquee";
import { cn } from "@/lib/utils";

export interface TestimonialCardProps
    extends React.HTMLAttributes<HTMLDivElement> {
    name: string;
    role: string;
    img?: string;
    description: React.ReactNode;
    className?: string;
}

export const TestimonialCard = ({
    description,
    name,
    img,
    role,
    className,
    ...props
}: TestimonialCardProps) => (
    <div
        className={cn(
            "flex w-full max-w-[400px] cursor-pointer break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl p-6",
            // white background
            "bg-white dark:bg-muted",
            "shadow-[0px_0px_0px_1px_rgba(0,0,0,0.04),0px_8px_12px_-4px_rgba(15,12,12,0.08),0px_1px_2px_0px_rgba(15,12,12,0.10)]",
            className,
        )}
        {...props}
    >
        <div className="select-none leading-relaxed font-normal text-muted-foreground">
            {description}
        </div>

        <div className="flex w-full select-none items-center justify-start gap-3.5">
            <img src={img} alt={name} className="size-10 rounded-full" />

            <div>
                <p className="font-medium text-foreground">{name}</p>
                <p className="text-sm font-normal text-muted-foreground">{role}</p>
            </div>
        </div>
    </div>
);

interface Testimonial {
    id: string;
    name: string;
    role: string;
    img: string;
    description: React.ReactNode;
}

export function SocialProofTestimonials({
    testimonials,
}: {
    testimonials: Testimonial[];
}) {
    const firstRow = testimonials.slice(0, Math.ceil(testimonials.length / 2));
    const secondRow = testimonials.slice(Math.ceil(testimonials.length / 2));

    return (
        <div className="relative w-full overflow-hidden py-8">
            <div className="flex flex-col gap-4">
                <Marquee className="[--duration:40s]" pauseOnHover>
                    {firstRow.map((testimonial, idx) => (
                        <TestimonialCard {...testimonial} key={idx} />
                    ))}
                </Marquee>
                <Marquee className="[--duration:40s]" reverse pauseOnHover>
                    {secondRow.map((testimonial, idx) => (
                        <TestimonialCard {...testimonial} key={idx} />
                    ))}
                </Marquee>
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/12 bg-linear-to-r from-background"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/12 bg-linear-to-l from-background"></div>
        </div>
    );
}

