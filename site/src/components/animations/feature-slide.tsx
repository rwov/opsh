"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { TerminalWindow } from "@/components/animations/sections/terminal-browser-preview";
import { cn } from "@/lib/utils";

type FeatureItem = {
  id: number;
  title: string;
  content: string;
  image?: string;
  video?: string;
  terminal?: {
    command: string;
    output: string[];
    opsh?: boolean;
  };
};

type FeatureProps = {
  collapseDelay?: number;
  linePosition?: "left" | "right" | "top" | "bottom";
  lineColor?: string;
  featureItems: FeatureItem[];
};

const LINE_POSITION_CLASSES = {
  left: "left-0 top-0 bottom-0 w-px",
  right: "right-0 top-0 bottom-0 w-px",
  top: "top-0 left-0 right-0 h-px",
  bottom: "bottom-0 left-0 right-0 h-px",
} as const;

const MEDIA_TRANSITION = {
  duration: 0.3,
  ease: "easeInOut" as const,
};

export const Feature = ({
  collapseDelay = 5000,
  linePosition = "left",
  lineColor = "bg-neutral-500 dark:bg-white",
  featureItems,
}: FeatureProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [primaryColor, setPrimaryColor] = useState("rgb(0, 0, 0)");
  const [trigger, setTrigger] = useState(0); // Used to reset the interval

  useEffect(() => {
    const updatePrimaryColor = () => {
      const tempDiv = document.createElement("div");
      tempDiv.style.color = "var(--primary)";
      document.body.appendChild(tempDiv);
      const computedColor = window.getComputedStyle(tempDiv).color;
      document.body.removeChild(tempDiv);
      setPrimaryColor(computedColor);
    };

    updatePrimaryColor();

    const observer = new MutationObserver(updatePrimaryColor);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => observer.disconnect();
  }, []);

  const isInView = useInView(containerRef, { amount: "some" });
  const isVertical = linePosition === "left" || linePosition === "right";
  const currentItem = featureItems[currentIndex];

  const handleTabClick = useCallback((index: number) => {
    setCurrentIndex(index);
    setTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isInView || featureItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featureItems.length);
    }, collapseDelay);

    return () => clearInterval(interval);
  }, [isInView, featureItems.length, collapseDelay, trigger]);

  const renderMedia = () => {
    if (!currentItem) {
      return (
        <motion.div
          key={`empty-${currentIndex}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={MEDIA_TRANSITION}
          className="min-h-[400px] w-full rounded-xl border border-border bg-muted p-1"
        />
      );
    }

    if (currentItem.image) {
      return (
        <motion.img
          key={`image-${currentIndex}-${currentItem.id}`}
          src={currentItem.image}
          alt={currentItem.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={MEDIA_TRANSITION}
          className="h-full w-full min-h-[400px] rounded-xl border border-border object-cover p-1"
        />
      );
    }

    if (currentItem.video) {
      return (
        <motion.video
          key={`video-${currentIndex}-${currentItem.id}`}
          src={currentItem.video}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={MEDIA_TRANSITION}
          className="min-h-[400px] h-full w-full rounded-lg object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      );
    }

    if (currentItem.terminal) {
      return (
        <motion.div
          key={`terminal-${currentIndex}-${currentItem.id}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={MEDIA_TRANSITION}
          className="min-h-[400px] w-full rounded-xl border border-border bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.14),_transparent_50%),linear-gradient(to_bottom_right,_hsl(var(--muted)),_hsl(var(--background)))] p-6 md:p-8 lg:p-10"
        >
          <div className="mx-auto flex h-full min-h-[350px] w-full max-w-5xl items-center justify-center">
            <div className="h-[78%] w-full flex items-center justify-center">
              <TerminalWindow
                command={currentItem.terminal.command}
                output={currentItem.terminal.output}
                opsh={currentItem.terminal.opsh}
                className="h-full lg:w-[60%] max-w-none shadow-2xl shadow-primary/10"
                bodyClassName="h-full min-h-[280px] text-sm md:text-base"
              />
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={`fallback-${currentIndex}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={MEDIA_TRANSITION}
        className="min-h-[400px] w-full rounded-xl border border-border bg-muted p-1"
      />
    );
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col">
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 overflow-hidden border-b">
        {featureItems.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleTabClick(index)}
            className="relative cursor-pointer overflow-hidden w-full min-h-[44px] p-5 text-sm font-semibold whitespace-nowrap transition-colors text-center group flex items-center justify-center touch-manipulation before:absolute before:left-0 before:top-0 before:z-10 before:h-screen before:w-px first:before:bg-transparent before:bg-border before:content-[''] after:absolute after:-left-px after:-top-px after:z-10 after:w-screen after:h-px last:after:bg-transparent after:bg-border after:content-['']"
          >
            {currentIndex === index && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={MEDIA_TRANSITION}
                className="absolute inset-0 w-[calc(100%+1rem)] h-10 -z-10 mask-[linear-gradient(to_bottom,white,transparent)]"
              >
                <FlickeringGrid
                  className="absolute inset-0 z-0 size-full"
                  squareSize={3}
                  gridGap={2}
                  color={primaryColor}
                  maxOpacity={0.5}
                  flickerChance={0.2}
                />
              </motion.div>
            )}
            {item.title}
            {currentIndex === index && (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute",
                  LINE_POSITION_CLASSES[linePosition],
                )}
              >
                <motion.span
                  key={`${currentIndex}-${trigger}`}
                  className={cn(
                    "absolute inset-0 -top-px",
                    isVertical ? "origin-top" : "origin-left",
                    lineColor,
                    isVertical ? "w-px h-full" : "h-px w-full",
                  )}
                  initial={isVertical ? { scaleY: 0 } : { scaleX: 0 }}
                  animate={isVertical ? { scaleY: 1 } : { scaleX: 1 }}
                  transition={{
                    duration: collapseDelay / 1000,
                    ease: "linear",
                  }}
                />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="w-full p-4 relative overflow-hidden">
        <AnimatePresence mode="wait">{renderMedia()}</AnimatePresence>
      </div>
    </div>
  );
};
