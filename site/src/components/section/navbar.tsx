"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { siteConfig } from "@/lib/config";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Icons } from "../icons";

function HamburgerButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="md:hidden relative z-50 flex size-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent"
      aria-label="Toggle menu"
    >
      <div className="relative size-5 flex items-center justify-center">
        <motion.span
          className="absolute h-0.5 w-4 bg-foreground"
          initial={false}
          animate={isOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
        <motion.span
          className="absolute h-0.5 w-4 bg-foreground"
          initial={false}
          animate={isOpen ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
      </div>
    </button>
  );
}

function DesktopNav() {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-1">
        {siteConfig.nav.links.map((link) => (
          <NavigationMenuItem key={link.id}>
            {link.submenu ? (
              <>
                <NavigationMenuTrigger className="border border-transparent text-foreground rounded-full h-8 w-fit px-2 pl-3 data-[state=open]:bg-accent/50 data-[state=open]:border-border bg-transparent">
                  {link.name}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="p-0!">
                  <div className="flex flex-col">
                    <div className="grid w-[1100px] grid-cols-3 gap-2 p-2">
                      {link.submenu.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-4 rounded-2xl border bg-muted p-4 hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex h-10 w-10 items-center justify-center border border-border rounded-lg bg-background">
                            {item.icon}
                          </div>
                          <div className="space-y-3">
                            <h3 className="text-xl font-semibold">
                              {item.name}
                            </h3>
                            <p className="text-base leading-relaxed text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                          {item.image && (
                            <div className="flex-1 rounded-xl border bg-card p-5">
                              <div className="relative h-full min-h-[200px] w-full overflow-hidden rounded-md">
                                <Image
                                  src={item.image.trim()}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center border-border mx-2 mb-2 bg-muted px-10 py-6 rounded-3xl border">
                      <p className="text-base text-muted-foreground">
                        Looking for a custom solution?{" "}
                        <Link
                          href="/contact"
                          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                        >
                          Let&apos;s talk
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </p>
                    </div>
                  </div>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink
                asChild
                className="border border-transparent hover:border-border text-foreground rounded-full h-8 w-fit px-2 bg-transparent"
              >
                <Link
                  href={link.href}
                  className="group inline-flex h-8 w-fit items-center justify-center rounded-full bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                >
                  {link.name}
                </Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
      <NavigationMenuViewport className="shadow-2xl border border-border" />
    </NavigationMenu>
  );
}

function MobileNav({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            style={{ top: "64px" }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 bottom-0 z-50 w-full bg-background shadow-2xl md:hidden overflow-y-auto"
          >
            <div className="flex h-full flex-col">
              <nav className="flex-1 px-6 py-8 pb-32">
                <div className="grid grid-cols-1 gap-4">
                  {siteConfig.nav.links.map((link, index) => (
                    <motion.div
                      key={link.id}
                      initial={{
                        opacity: 0,
                        y: -30,
                        filter: "blur(10px)",
                        clipPath: "inset(100% 0% 0% 0%)",
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                        clipPath: "inset(0% 0% 0% 0%)",
                      }}
                      transition={{
                        delay: index * 0.1,
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      {link.submenu ? (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem
                            value={`item-${link.id}`}
                            className="border-none"
                          >
                            <AccordionTrigger className="text-xl font-medium uppercase py-3 hover:no-underline px-0">
                              {link.name}
                            </AccordionTrigger>
                            <AccordionContent className="data-[state=closed]:animate-none! data-[state=open]:animate-none! overflow-hidden text-sm">
                              <ul className="grid grid-cols-1 gap-6 overflow-hidden pt-4">
                                {link.submenu.map((item, itemIndex) => (
                                  <motion.li
                                    key={item.id}
                                    className=""
                                    initial={{
                                      opacity: 0,
                                      y: -20,
                                      filter: "blur(8px)",
                                    }}
                                    animate={{
                                      opacity: 1,
                                      y: 0,
                                      filter: "blur(0px)",
                                    }}
                                    transition={{
                                      delay: itemIndex * 0.08,
                                      duration: 0.4,
                                      ease: [0.16, 1, 0.3, 1],
                                    }}
                                  >
                                    <Link
                                      href={item.href}
                                      onClick={onClose}
                                      className="flex items-start gap-3 transition-colors"
                                    >
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-muted border border-border rounded-lg">
                                        {item.icon}
                                      </div>
                                      <div className="flex-1 space-y-1">
                                        <h3 className="text-sm font-medium text-foreground">
                                          {item.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                          {item.description}
                                        </p>
                                      </div>
                                    </Link>
                                  </motion.li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ) : (
                        <Link
                          href={link.href}
                          onClick={onClose}
                          className="block px-0 py-3 text-xl font-medium uppercase transition-colors hover:text-accent-foreground"
                        >
                          {link.name}
                        </Link>
                      )}
                    </motion.div>
                  ))}
                </div>
              </nav>
              <div className="sticky bottom-0 w-full p-6 bg-background border-t border-border">
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 30,
                    filter: "blur(10px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }}
                  transition={{
                    delay: 0.1,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <Button
                    asChild
                    onClick={onClose}
                    className="w-full rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Link href="/install">{siteConfig.cta}</Link>
                  </Button>
                </motion.div>
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 30,
                    filter: "blur(10px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }}
                  transition={{
                    delay: 0.2,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="mt-4 w-full px-0 py-3 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    Looking for a custom solution?{" "}
                    <Link
                      href="/contact"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Let&apos;s talk
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold"
        >
          <Icons.logo className="w-32 h-8" />
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            asChild
            className="hidden md:flex rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/install">{siteConfig.cta}</Link>
          </Button>
          <HamburgerButton
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </div>
      </div>

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </motion.header>
  );
}
