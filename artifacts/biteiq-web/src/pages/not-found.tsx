import { Link } from "wouter";
import { useEffect } from "react";

export default function NotFound() {
  useEffect(() => {
    document.title = "Not found — BiteIQ";
  }, []);
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-primary">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link
          href="/"
          className="no-underline inline-flex mt-8 items-center justify-center rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
