import { Link, useLocation } from "wouter";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/delete-account", label: "Delete account" },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Logo />
            <span className="font-semibold tracking-tight text-lg text-foreground">
              BiteIQ
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {NAV_LINKS.map((link) => {
              const active = location === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    "no-underline transition-colors " +
                    (active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground")
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border mt-24">
        <div className="mx-auto max-w-5xl px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BiteIQ
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {NAV_LINKS.filter((l) => l.href !== "/").map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="no-underline text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="mailto:support@biteiq.tech"
              className="no-underline text-muted-foreground hover:text-foreground"
            >
              support@biteiq.tech
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground font-black text-sm">
      B
    </span>
  );
}
