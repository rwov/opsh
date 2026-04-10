import { cn } from "@/lib/utils";

type CornerPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "all";

interface CornerPlusProps {
    position?: CornerPosition;
    className?: string;
}

function CornerPlusSingle({ position, className }: { position: Exclude<CornerPosition, "all">; className?: string }) {
    const positionClasses = {
        "top-left": {
            h1: "-top-px -left-3",
            h2: "-top-px left-0",
            v1: "-top-3 -left-px",
            v2: "top-0 -left-px",
        },
        "top-right": {
            h1: "-top-px -right-3",
            h2: "-top-px right-0",
            v1: "-top-3 -right-px",
            v2: "top-0 -right-px",
        },
        "bottom-left": {
            h1: "-bottom-px -left-3",
            h2: "-bottom-px left-0",
            v1: "-bottom-3 -left-px",
            v2: "bottom-0 -left-px",
        },
        "bottom-right": {
            h1: "-bottom-px -right-3",
            h2: "-bottom-px right-0",
            v1: "-bottom-3 -right-px",
            v2: "bottom-0 -right-px",
        },
    };

    const classes = positionClasses[position];

    return (
        <>
            {/* Horizontal line 1 */}
            <div className={cn("h-px absolute w-3 bg-current z-40", classes.h1, className)}></div>
            {/* Horizontal line 2 */}
            <div className={cn("h-px absolute w-3 bg-current z-40", classes.h2, className)}></div>
            {/* Vertical line 1 */}
            <div className={cn("w-px absolute h-3 bg-current z-40", classes.v1, className)}></div>
            {/* Vertical line 2 */}
            <div className={cn("w-px absolute h-3 bg-current z-40", classes.v2, className)}></div>
        </>
    );
}

export function CornerPlus({ position = "all", className }: CornerPlusProps) {
    if (position === "all") {
        return (
            <>
                <CornerPlusSingle position="top-left" className={className} />
                <CornerPlusSingle position="top-right" className={className} />
                <CornerPlusSingle position="bottom-left" className={className} />
                <CornerPlusSingle position="bottom-right" className={className} />
            </>
        );
    }

    return <CornerPlusSingle position={position} className={className} />;
}

