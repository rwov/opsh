"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyCheckIcon, CopyIcon } from "lucide-react";

const COMMANDS = {
  install: "curl -fsSL https://opsh.dxu.one/install.sh | bash",
  uninstall: "curl -fsSL https://opsh.dxu.one/uninstall.sh | bash",
} as const;

type TabKey = keyof typeof COMMANDS;

export function InstallCommandPanel() {
  const [activeTab, setActiveTab] = useState<TabKey>("install");
  const [copied, setCopied] = useState(false);

  const command = useMemo(() => COMMANDS[activeTab], [activeTab]);

  async function handleCopy() {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="group w-full max-w-3xl">
      <div className="inline-flex rounded-t-2xl border border-b-0 border-border bg-muted/70 p-1">
        {(["install", "uninstall"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-xl px-5 py-2 text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="relative rounded-r-2xl rounded-b-2xl border border-border bg-background p-5 md:p-6">
        <Button
          type="button"
          onClick={handleCopy}
          size={"icon"}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg border border-border bg-background text-foreground opacity-0 shadow-none transition-opacity hover:bg-muted group-hover:opacity-100"
          variant="ghost"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
        <div className="pr-16">
          <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-base leading-7 text-foreground">
            <code>{command}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
