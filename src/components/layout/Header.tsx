"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { whatsappLink } from "@/lib/contact";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
];

const ctaHref = whatsappLink("getEjari");

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/70 bg-white/75 backdrop-blur-xl"
          : "border-b border-transparent bg-white/0"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" aria-label="MyEjari home" className="inline-flex items-center">
          <Image
            src="/logo-black.png"
            alt="MyEjari — Virtual Office Ejari Dubai"
            width={520}
            height={180}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-dark transition-colors hover:bg-gray-light hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            data-track="whatsapp"
            data-source="header_desktop"
            className="group ml-2 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_18px_-6px_rgba(13,19,26,0.5)] transition-all hover:-translate-y-0.5 hover:bg-primary hover:shadow-[0_10px_24px_-6px_rgba(241,90,36,0.5)]"
          >
            <WhatsAppIcon size={14} />
            Get Ejari Now
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border bg-white md:hidden"
          >
            <div className="flex flex-col gap-2 px-4 py-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-gray-dark transition-colors hover:bg-gray-light hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                data-track="whatsapp"
                data-source="header_mobile"
                onClick={() => setMobileOpen(false)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-white"
              >
                <WhatsAppIcon size={14} />
                Get Ejari Now
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
