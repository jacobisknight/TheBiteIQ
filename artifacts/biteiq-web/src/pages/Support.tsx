import { PolicyPage } from "@/components/PolicyPage";

export default function Support() {
  return (
    <PolicyPage
      title="Support"
      description="Get help with BiteIQ — common questions and how to reach us."
      effectiveDate="January 1, 2026"
    >
      <p>
        We want BiteIQ to work great for you. If you run into trouble or
        have a question, the fastest way to reach us is by email. We aim to
        reply within one business day.
      </p>

      <h2>Contact us</h2>
      <ul>
        <li>
          <strong>General support:</strong>{" "}
          <a href="mailto:support@biteiq.tech">support@biteiq.tech</a>
        </li>
        <li>
          <strong>Privacy and data requests:</strong>{" "}
          <a href="mailto:privacy@biteiq.tech">privacy@biteiq.tech</a>
        </li>
      </ul>

      <h2>Frequently asked questions</h2>

      <h3>How accurate is photo logging?</h3>
      <p>
        Photo logging uses AI to identify foods and estimate portions.
        Estimates are usually close, but they can be off — especially with
        mixed dishes or unusual servings. You can always tap the entry to
        edit it after logging.
      </p>

      <h3>Why are my macros and calorie targets different from another app?</h3>
      <p>
        BiteIQ calculates your daily targets based on your age, sex, height,
        weight, activity level, and goal. Different apps use slightly
        different formulas (we use Mifflin–St Jeor with standard activity
        multipliers). If you have specific guidance from a doctor or
        dietitian, you can override the values in your profile.
      </p>

      <h3>Can I use BiteIQ without an internet connection?</h3>
      <p>
        Most of the app works offline (your meals, weights, and dashboard
        are stored on your device). Photo logging, voice logging, and the AI
        coach require an internet connection because they call our cloud AI
        service.
      </p>

      <h3>How do I connect Apple Health?</h3>
      <p>
        Open the BiteIQ app, go to <em>Devices</em>, tap{" "}
        <em>Connect Apple Health</em>, and grant the permissions you're
        comfortable with. You can change permissions later in iOS Settings →
        Privacy & Security → Health → BiteIQ.
      </p>

      <h3>How do I cancel my subscription?</h3>
      <p>
        Subscriptions are managed by the App Store. Open Settings → tap your
        Apple ID → Subscriptions → BiteIQ → Cancel. Your access continues
        until the end of the current billing period.
      </p>

      <h3>How do I delete my account?</h3>
      <p>
        Email <a href="mailto:privacy@biteiq.tech">privacy@biteiq.tech</a>{" "}
        from the address on your account with the subject line{" "}
        <em>Delete my account</em>, and we will permanently remove your
        data within 30 days. Full instructions are on our{" "}
        <a href="/delete-account">Delete account</a> page.
      </p>

      <h3>How do I report a bug or suggest a feature?</h3>
      <p>
        Email <a href="mailto:support@biteiq.tech">support@biteiq.tech</a>{" "}
        with as much detail as you can — what you were doing, what you
        expected, and what happened. Screenshots help.
      </p>

      <h3>Is BiteIQ medical advice?</h3>
      <p>
        No. BiteIQ is a wellness tool, not a medical device. Always talk to
        a qualified healthcare professional before making changes to your
        diet or medications. See our{" "}
        <a href="/terms">Terms of Service</a> for details.
      </p>
    </PolicyPage>
  );
}
