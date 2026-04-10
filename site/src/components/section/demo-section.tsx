import { Feature } from "@/components/animations/feature-slide";
import { siteConfig } from "@/lib/config";

export function DemoSection() {
    const { items } = siteConfig.demoSection;

    return (
        <section
            id="demo"
            className="w-full relative"
        >
            <Feature
                collapseDelay={5000}
                linePosition="bottom"
                featureItems={items}
                lineColor="bg-sky-500"
            />
        </section>
    );
}
