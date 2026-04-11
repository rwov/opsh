"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { siteConfig } from "@/lib/config";
import { AgentWorkflowBlock } from "@/components/animations/sections/agent-workflow-block";
import { CornerPlus } from "@/components/ui/corner-plus";
import { LazyDither } from "@/components/animations/lazy-dither";
import { TerminalCodeWindow } from "../animations/sections/terminal-browser-preview";

const workflowConnectConfig = siteConfig.workflowConnectSection;
const shellInitCode = `# >>> opsh initialize >>>
export PATH="/Users/opsh/.opsh/bin:$PATH"
case $- in
  *i*)
    if [ -z "\${OPSH_DISABLE_AUTO:-}" ] && [ -z "\${OPSH_ACTIVE_SHELL:-}" ] && [ -x "/Users/opsh/.opsh/bin/opsh" ]; then
      export OPSH_ACTIVE_SHELL=1
      exec "/Users/opsh/.opsh/bin/opsh"
    fi
    ;;
esac
# <<< opsh initialize <<<`;

export function WorkflowConnectSection() {
  return (
    <section
      id="workflow"
      className="w-full relative flex flex-col divide-y divide-border"
    >
      <div className="relative h-14 overflow-hidden">
        <div className="absolute inset-0">
          <LazyDither enableMouseInteraction={true} />
        </div>
      </div>

      <div className="mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-6">
          <div className="col-span-1 md:col-span-2 p-8 md:p-10 lg:p-14 md:sticky md:top-20 md:self-start flex flex-col gap-7">
            <h3 className="text-3xl lg:text-4xl font-medium tracking-tighter text-left text-balance">
              {workflowConnectConfig.title}
            </h3>
            <p className="text-muted-foreground text-left text-balance">
              {workflowConnectConfig.description}
            </p>
            {/* <Button
              variant="secondary"
              className="w-fit border border-border"
              asChild
            >
              <a href={workflowConnectConfig.ctaButton.href}>
                {workflowConnectConfig.ctaButton.text}
                <Icons.arrowRight className="size-4 text-foreground" />
              </a>
            </Button> */}
          </div>

          <div className="col-span-1 md:col-span-4 w-full border-t md:border-t-0 md:border-l border-border relative">
            <CornerPlus position="all" className="text-muted-foreground/50" />
            <div className="w-full divide-y divide-border">
              <div>
                <div className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center p-6 md:p-12 overflow-visible">
                  <TerminalCodeWindow
                    title="~/.zprofile"
                    code={shellInitCode}
                    className="w-full max-w-4xl shadow-2xl shadow-primary/10"
                    bodyClassName="md:text-[13px]"
                  />
                </div>
                <div className="max-w-xl text-left items-start p-6">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 justify-start">
                    {workflowConnectConfig.blocks[0].icon}
                    {workflowConnectConfig.blocks[0].title}
                  </p>
                  <p className="text-base text-foreground leading-relaxed mt-2">
                    {workflowConnectConfig.blocks[0].description}
                  </p>
                </div>
              </div>

              <div className="relative">
                <CornerPlus
                  position="top-left"
                  className="text-muted-foreground/50"
                />
                <CornerPlus
                  position="top-right"
                  className="text-muted-foreground/50"
                />
                <AgentWorkflowBlock />
                <div className="max-w-xl text-left items-start p-6">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 justify-start">
                    {workflowConnectConfig.blocks[1].icon}
                    {workflowConnectConfig.blocks[1].title}
                  </p>
                  <p className="text-base text-foreground leading-relaxed mt-2">
                    {workflowConnectConfig.blocks[1].description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
