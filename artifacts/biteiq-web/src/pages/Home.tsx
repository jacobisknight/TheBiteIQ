import { Link } from "wouter";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    document.title = "BiteIQ — Smart, simple nutrition tracking";
    setMeta(
      "description",
      "BiteIQ makes nutrition logging effortless: snap a photo, speak your meal, or search. Get a personalized plan, weight trends, and a friendly AI coach.",
    );
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-50 pointer-events-none">
          <div className="absolute -top-32 -left-24 w-[42rem] h-[42rem] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Now on iOS
          </span>
          <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            Nutrition tracking
            <br />
            that finally{" "}
            <span className="text-primary">feels easy.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Snap a photo, speak your meal, or search — BiteIQ logs it for you,
            keeps an eye on your weight trend, and a friendly coach helps you
            stay on track.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#features"
              className="no-underline inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition glow-primary"
            >
              See what BiteIQ does
            </a>
            <Link
              href="/support"
              className="no-underline inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-card-elevated transition"
            >
              Need help?
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">
          Built around how you actually eat.
        </h2>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          <FeatureCard
            title="Photo logging"
            body="Take a picture of your plate. BiteIQ identifies what's on it and estimates calories and macros."
            tone="primary"
          />
          <FeatureCard
            title="Voice logging"
            body="Talk to your phone like you'd tell a friend. 'A burrito bowl with chicken and brown rice' — done."
            tone="accent"
          />
          <FeatureCard
            title="Weight trend"
            body="See the line through the noise. BiteIQ smooths out daily fluctuations so you see the real direction."
            tone="primary"
          />
          <FeatureCard
            title="Personal plan"
            body="Tell BiteIQ your goal — lose, maintain, gain, or GLP-1 mode — and it tunes your daily targets."
            tone="primary"
          />
          <FeatureCard
            title="Friendly AI coach"
            body="Ask anything, anytime. Get plain-English advice on meals, workouts, and travel days."
            tone="accent"
          />
          <FeatureCard
            title="Apple Health"
            body="Sync weight, steps, sleep, and active energy from Apple Health to enrich your dashboard."
            tone="primary"
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-border bg-card-elevated p-10 md:p-14 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Your data stays yours.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            BiteIQ doesn't sell your information. You can export or delete
            everything from inside the app at any time. Health data is private
            to your account and never shared with advertisers.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/privacy"
              className="no-underline inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-card transition"
            >
              Privacy policy
            </Link>
            <Link
              href="/delete-account"
              className="no-underline inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-card transition"
            >
              Delete your account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: "primary" | "accent";
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors">
      <div
        className={
          "w-9 h-9 rounded-xl flex items-center justify-center mb-4 " +
          (tone === "primary"
            ? "bg-primary/15 text-primary"
            : "bg-accent/15 text-accent")
        }
      >
        <span className="w-2 h-2 rounded-full bg-current" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {body}
      </p>
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
