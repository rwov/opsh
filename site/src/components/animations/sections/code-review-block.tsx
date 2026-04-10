"use client";

import { useRef, useState, useEffect, useMemo, memo } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { cn } from "@/lib/utils";

const buttonText = "Apply suggestion";
const codeBlock = {
  fileName: "",
  imports: [
    "import { useState, useEffect } from 'react';",
    "import { cn } from '@/lib/utils';",
  ],
  before: [
    "const [count, setCount] = useState(0);",
    "useEffect(() => {",
    "  console.log(count);",
    "}, [count]);",
  ],
  after: [
    "const [count, setCount] = useState(0);",
    "",
    "useEffect(() => {",
    "  console.log('Count changed:', count);",
    "}, [count]);",
  ],
  rest: [
    "export function useCounter() {",
    "  return { count, setCount };",
    "}",
  ],
};

const SEQUENCE = [
  { action: "buttonClick", delay: 1000 },
  { action: "applied", delay: 500 },
] as const;

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const deletionVariants = {
  visible: { opacity: 1, height: "auto" },
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    marginTop: 0,
    transition: {
      opacity: { duration: 0.2 },
      height: { duration: 0.4, delay: 0.2, ease: "easeInOut" as const },
      marginBottom: { duration: 0.4, delay: 0.2, ease: "easeInOut" as const },
      marginTop: { duration: 0.4, delay: 0.2, ease: "easeInOut" as const },
    },
  },
};

const additionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  clicked: { scale: [1, 0.95, 1] },
};

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
};

export function CodeReviewBlock() {
  const codeBlockRef = useRef<HTMLDivElement>(null);
  const codeBlockInView = useInView(codeBlockRef, {
    amount: 0.9,
    margin: "100px 0px -80px 0px",
  });
  const [isApplied, setIsApplied] = useState(false);
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceIndexRef = useRef(0);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!codeBlockInView) {
      timerRef.current = setTimeout(() => {
        setIsApplied(false);
        setIsButtonClicked(false);
      }, 0);
      sequenceIndexRef.current = 0;
      return;
    }

    sequenceIndexRef.current = 0;

    const runSequence = () => {
      if (sequenceIndexRef.current >= SEQUENCE.length) {
        return;
      }

      const { action, delay } = SEQUENCE[sequenceIndexRef.current];
      sequenceIndexRef.current += 1;

      timerRef.current = setTimeout(() => {
        if (action === "buttonClick") {
          setIsButtonClicked(true);
        } else if (action === "applied") {
          setIsApplied(true);
        }

        if (sequenceIndexRef.current < SEQUENCE.length) {
          runSequence();
        }
      }, delay);
    };

    runSequence();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      sequenceIndexRef.current = 0;
    };
  }, [codeBlockInView]);

  return (
    <div
      ref={codeBlockRef}
      className="relative min-h-[500px] flex items-center justify-center p-6 md:p-12 overflow-visible"
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        transition={{ ...springTransition, delay: 0.2 }}
        variants={containerVariants}
        className="relative w-full max-w-lg"
      >
        <CodeEditor
          fileName={codeBlock.fileName}
          imports={codeBlock.imports}
          before={codeBlock.before}
          after={codeBlock.after}
          rest={codeBlock.rest}
          isApplied={isApplied}
        />

        <AnimatePresence>
          {!isApplied && (
            <ApplyButton text={buttonText} isClicked={isButtonClicked} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const CodeEditor = memo(function CodeEditor({
  fileName,
  imports,
  before,
  after,
  rest,
  isApplied,
}: {
  fileName: string;
  imports: string[];
  before: string[];
  after: string[];
  rest: string[];
  isApplied: boolean;
}) {
  return (
    <div className="w-full bg-card rounded-xl border border-border relative overflow-hidden">
      <div className="bg-muted px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">{fileName}</span>
        </div>
      </div>

      <div className="bg-background p-4 md:p-6 font-mono text-xs md:text-sm overflow-hidden">
        <div className="space-y-1">
          {imports.map((line, index) => (
            <div key={index} className="flex">
              <span className="text-foreground">{line}</span>
            </div>
          ))}

          <div className="flex">
            <span />
          </div>

          <div className="flex">
            <span className="text-foreground">{rest[0]}</span>
          </div>

          <AnimatePresence>
            {!isApplied && (
              <motion.div
                variants={deletionVariants}
                initial="visible"
                exit="hidden"
                className="space-y-1"
              >
                {before.map((line, index) => (
                  <div
                    key={index}
                    className="flex bg-destructive/10 border-l-2 border-destructive pl-2"
                  >
                    <span className="text-destructive line-through">
                      - {line}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            variants={additionVariants}
            initial="hidden"
            animate="visible"
            transition={{ ...springTransition, delay: 0.3 }}
            className="space-y-1"
          >
            {after.map((line, index) => (
              <div
                key={index}
                className={cn(
                  "flex border-l-2 pl-2",
                  !isApplied
                    ? "bg-success/10 border-success"
                    : "border-transparent",
                )}
              >
                <span
                  className={cn(
                    !isApplied ? "text-success" : "text-foreground",
                  )}
                >
                  {!isApplied ? "+ " : ""}
                  {line}
                </span>
              </div>
            ))}
          </motion.div>

          {rest.slice(1).map((line, index) => (
            <div key={index} className="flex">
              <span className="text-foreground">{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const ApplyButton = memo(function ApplyButton({
  text,
  isClicked,
}: {
  text: string;
  isClicked: boolean;
}) {
  const buttonAnimation = useMemo(
    () => ({
      opacity: 1,
      scale: isClicked
        ? buttonVariants.clicked.scale
        : buttonVariants.visible.scale,
    }),
    [isClicked],
  );

  return (
    <motion.button
      variants={buttonVariants}
      initial="hidden"
      animate={buttonAnimation}
      exit="hidden"
      transition={{
        scale: { duration: 0.2, ease: "easeInOut" },
        opacity: { duration: 0.2 },
      }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-linear-to-b from-[#E5E7EB]/40 dark:from-[#404040]/40 to-[#E5E7EB] dark:to-[#404040] text-secondary-foreground border border-card-foreground/20 h-12 w-fit px-6 text-sm font-medium backdrop-blur-2xl shadow-[0px_39px_16px_rgba(0,0,0,0.01),0px_22px_13px_rgba(0,0,0,0.05),0px_10px_10px_rgba(0,0,0,0.09),0px_2px_5px_rgba(0,0,0,0.1)] whitespace-nowrap"
    >
      {text}
    </motion.button>
  );
});
