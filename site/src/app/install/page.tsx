import { InstallCommandPanel } from "@/components/section/install-command-panel";
import { Footer } from "@/components/section/footer";

export default function InstallPage() {
  return (
    <main className="flex flex-col pt-16">
      <section className="border-b border-border px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto flex max-w-5xl justify-center">
          <InstallCommandPanel />
        </div>
      </section>
      <Footer />
    </main>
  );
}
