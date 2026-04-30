import type { ReactNode } from "react";
import { useEffect } from "react";

interface PolicyPageProps {
  title: string;
  description: string;
  effectiveDate: string;
  children: ReactNode;
}

export function PolicyPage({
  title,
  description,
  effectiveDate,
  children,
}: PolicyPageProps) {
  useEffect(() => {
    document.title = `${title} — BiteIQ`;
    setMeta("description", description);
  }, [title, description]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-primary mb-4">
        BiteIQ Policy
      </p>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-muted-foreground">
        Effective {effectiveDate}
      </p>

      <article
        className="prose prose-invert mt-12 max-w-none
        prose-headings:tracking-tight prose-headings:text-foreground
        prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
        prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-foreground/85 prose-p:leading-relaxed
        prose-li:text-foreground/85 prose-li:leading-relaxed
        prose-strong:text-foreground
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
      >
        {children}
      </article>
    </div>
  );
}

function setMeta(name: string, content: string) {
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
