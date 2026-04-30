import { PolicyPage } from "@/components/PolicyPage";

export default function Privacy() {
  return (
    <PolicyPage
      title="Privacy Policy"
      description="How BiteIQ collects, uses, and protects your information."
      effectiveDate="January 1, 2026"
    >
      <p>
        BiteIQ ("we," "us," or "our") respects your privacy. This Privacy
        Policy explains what information we collect when you use the BiteIQ
        mobile application and related services (the "Service"), how we use
        that information, who we share it with, and the choices you have.
      </p>

      <h2>1. Information we collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li>
          <strong>Account information.</strong> When you create an account
          we collect your email address, a hashed password (or a federated
          identifier such as Apple or Google sign-in), and basic profile
          information you choose to provide such as your name.
        </li>
        <li>
          <strong>Profile and goal information.</strong> Your age, sex,
          height, weight, activity level, dietary preferences, and goal
          (lose, maintain, gain, or GLP-1 mode), used to compute your daily
          targets.
        </li>
        <li>
          <strong>Meals and nutrition.</strong> Meals you log, food
          searches, photos of meals, voice notes you record for logging,
          weight entries, and water intake.
        </li>
        <li>
          <strong>Coach conversations.</strong> The messages you send to
          the in-app AI coach and the responses you receive.
        </li>
        <li>
          <strong>Customer support.</strong> If you contact us, we keep the
          messages you send and our replies so we can help you and improve
          the Service.
        </li>
      </ul>

      <h3>Information collected with your permission</h3>
      <p>
        BiteIQ asks for the following iOS permissions. Each permission is
        used only for the purpose described, and you can change any of
        them at any time in iOS Settings → BiteIQ.
      </p>
      <ul>
        <li>
          <strong>Camera.</strong> To take a photo of a meal so the app can
          identify the food and estimate its nutrition. Photos are sent to
          our AI provider for analysis (see "Sharing" below) and stored
          with the corresponding meal entry on your account.
        </li>
        <li>
          <strong>Photo Library.</strong> To let you pick an existing
          photo of a meal to log. Only the photo you choose is read; we do
          not access your full library.
        </li>
        <li>
          <strong>Microphone &amp; Speech Recognition.</strong> To record
          short voice notes describing what you ate. Audio is transcribed
          by our AI provider and the transcript is saved with the meal
          entry. We do not use the microphone in the background.
        </li>
        <li>
          <strong>Notifications.</strong> If you enable notifications,
          we use them only for service-related reminders (for example, to
          help you remember to log dinner). You can turn them off at any
          time.
        </li>
      </ul>

      <h3>Information collected automatically</h3>
      <ul>
        <li>
          <strong>Device and usage data.</strong> Device model, operating
          system version, app version, language, time zone, crash logs,
          and coarse usage analytics (for example, which screens were
          viewed) collected for diagnostics and product improvement.
        </li>
        <li>
          <strong>Identifiers.</strong> An internal user identifier so we
          can associate your data with your account.
        </li>
      </ul>

      <h3>Information from connected health services</h3>
      <p>
        BiteIQ can read health and activity data from third-party services
        you choose to connect. We read only the data types listed below
        and only after you grant permission. You can disconnect any
        provider at any time inside the app on the <em>Devices</em>{" "}
        screen.
      </p>
      <ul>
        <li>
          <strong>Apple Health (HealthKit).</strong> Steps, active energy
          burned, sleep, heart rate, and body weight. You control the
          exact set of permissions in iOS Settings → Privacy &amp;
          Security → Health → BiteIQ.
        </li>
        <li>
          <strong>Whoop.</strong> Recovery, strain, sleep performance, and
          heart rate variability (HRV).
        </li>
        <li>
          <strong>Oura.</strong> Readiness, sleep score, HRV, and daily
          activity.
        </li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide the core features of the app — logging, dashboards, plans, and coaching.</li>
        <li>To personalize your daily targets and recommendations.</li>
        <li>To process meal photos, voice notes, and coach prompts through our AI partners (see "Sharing" below).</li>
        <li>To diagnose crashes, prevent abuse, and improve the Service.</li>
        <li>To respond to your support requests.</li>
        <li>
          To send service-related notifications (for example, account or
          security alerts). We do not send marketing email without your
          consent.
        </li>
      </ul>

      <h2>3. Sharing</h2>
      <p>
        We do <strong>not</strong> sell your personal information, and we
        do <strong>not</strong> share your data with advertisers. We share
        information only with the following categories of recipients and
        only as needed to operate the Service:
      </p>
      <ul>
        <li>
          <strong>Authentication provider (Clerk).</strong> Stores your
          account credentials and session tokens.
        </li>
        <li>
          <strong>AI processing (OpenAI).</strong> Meal photos, voice
          recordings and their transcripts, coach prompts, and the
          relevant nutrition or profile context needed to answer them are
          sent to OpenAI's API to be processed. Per our agreement with
          OpenAI, this content is not used to train their general-purpose
          models. Your raw health data from Apple Health, Whoop, and Oura
          is not sent to OpenAI unless you reference it in a coach
          conversation.
        </li>
        <li>
          <strong>Connected health providers.</strong> When you connect
          Apple Health, Whoop, or Oura, BiteIQ exchanges OAuth tokens with
          those services to read the data types listed above. We do not
          write data back to those services unless you explicitly ask us
          to.
        </li>
        <li>
          <strong>Cloud hosting and storage.</strong> Our servers and
          databases run on Replit deployments. Encrypted backups may be
          stored with reputable cloud providers.
        </li>
        <li>
          <strong>Legal.</strong> We may disclose information if required
          by law, subpoena, or to protect the rights, safety, or property
          of BiteIQ or our users.
        </li>
      </ul>

      <h2>4. Health data</h2>
      <p>
        BiteIQ treats nutrition, weight, and connected health-service data
        as sensitive information. We do not use your health data for
        advertising. Health data is never sold or rented. Health data
        read from Apple Health, Whoop, or Oura stays linked to your
        account and is used only inside the app's dashboards and
        coaching.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We keep your information for as long as your account is active.
        When you delete your account (see the{" "}
        <a href="/delete-account">Delete account</a> page), we delete your
        profile, meals, weights, photos, voice notes, coach history, and
        connected-service tokens within 30 days, except where we are
        required to retain certain records for legal or accounting
        reasons.
      </p>

      <h2>6. Your rights</h2>
      <p>Depending on where you live, you may have rights to:</p>
      <ul>
        <li>Access the personal information we hold about you.</li>
        <li>Correct inaccurate information.</li>
        <li>Delete your information.</li>
        <li>Export a copy of your information.</li>
        <li>Object to or restrict certain processing.</li>
        <li>Withdraw consent where processing is based on consent.</li>
      </ul>
      <p>
        To exercise any of these rights, email{" "}
        <a href="mailto:privacy@biteiq.tech">privacy@biteiq.tech</a>. We
        will respond within the timeframe required by applicable law.
      </p>

      <h2>7. Children</h2>
      <p>
        BiteIQ is not intended for children under 13 (or under 16 in the
        European Economic Area). We do not knowingly collect personal
        information from children. If you believe a child has provided us
        with personal information, please contact us and we will delete
        it.
      </p>

      <h2>8. International transfers</h2>
      <p>
        BiteIQ is operated from the United States. If you are located
        outside the United States, your information will be transferred to
        and processed in the United States and other countries where our
        service providers operate.
      </p>

      <h2>9. Security</h2>
      <p>
        We use industry-standard safeguards including encryption in
        transit (TLS) and at rest, access controls, and regular reviews of
        our practices. No method of transmission over the internet is
        100% secure, but we work hard to protect your information.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. If we make
        material changes, we will notify you in the app or by email. The
        "Effective" date at the top of this page indicates when the
        policy was last revised.
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions about this policy? Email{" "}
        <a href="mailto:privacy@biteiq.tech">privacy@biteiq.tech</a>.
      </p>
    </PolicyPage>
  );
}
