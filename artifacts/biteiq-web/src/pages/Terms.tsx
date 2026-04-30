import { PolicyPage } from "@/components/PolicyPage";

export default function Terms() {
  return (
    <PolicyPage
      title="Terms of Service"
      description="The terms governing your use of BiteIQ."
      effectiveDate="January 1, 2026"
    >
      <p>
        These Terms of Service ("Terms") govern your access to and use of the
        BiteIQ mobile application and related services (the "Service")
        provided by BiteIQ ("we," "us," or "our"). Please read them
        carefully. By creating an account or using the Service, you agree to
        these Terms.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 13 years old (or 16 in the European Economic
        Area) to use BiteIQ. If you are using the Service on behalf of an
        organization, you represent that you have the authority to bind that
        organization to these Terms.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for the activity that happens under your
        account, for keeping your password (or federated sign-in
        credentials) secure, and for notifying us at{" "}
        <a href="mailto:support@biteiq.tech">support@biteiq.tech</a> if you
        suspect unauthorized use.
      </p>

      <h2>3. The Service</h2>
      <p>
        BiteIQ helps you log meals, track weight and progress, and receive
        AI-generated nutrition and workout suggestions. The Service is
        provided for personal, non-commercial use.
      </p>

      <h2>4. Not medical advice</h2>
      <p>
        BiteIQ is a wellness tool and is <strong>not</strong> a medical
        device. Information provided by the app, including the coach,
        suggested calorie targets, suggested macros, suggested meals, and
        suggested workouts, is for general informational purposes only and
        is not medical, nutritional, or fitness advice. Always consult a
        qualified healthcare professional before making changes to your
        diet, exercise routine, or medications, especially if you are
        pregnant, nursing, have a medical condition, or are taking any
        medication including GLP-1 medications.
      </p>

      <h2>5. AI-generated content</h2>
      <p>
        Some Service features use artificial intelligence to identify foods
        from photos, transcribe voice notes, estimate nutritional values,
        and generate meal and workout suggestions. AI output can be
        inaccurate or incomplete. You should review and confirm AI output
        before relying on it. We are not responsible for decisions you make
        based on AI output.
      </p>

      <h2>6. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service in violation of any law or regulation.</li>
        <li>Attempt to gain unauthorized access to the Service or other users' accounts.</li>
        <li>Reverse engineer, decompile, or attempt to extract source code from the Service except where permitted by law.</li>
        <li>Upload content that infringes intellectual property, is illegal, or contains malware.</li>
        <li>Use the Service to harass, abuse, or harm another person.</li>
        <li>Resell or commercially exploit the Service.</li>
      </ul>

      <h2>7. Your content</h2>
      <p>
        You retain ownership of the meals, photos, voice notes, weights,
        coach messages, and other content you submit ("Your Content"). You
        grant us a limited, worldwide, non-exclusive license to host,
        process, and display Your Content as needed to provide the Service
        to you. We do not use Your Content to train general-purpose AI
        models, and we do not sell Your Content to advertisers.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Service, including its visual design, source code, logos, and
        text, is owned by BiteIQ and protected by intellectual property
        laws. We grant you a limited, non-exclusive, non-transferable,
        revocable license to use the Service in accordance with these
        Terms.
      </p>

      <h2>9. Payment and subscriptions</h2>
      <p>
        Some features of the Service may require a paid subscription. If you
        purchase a subscription, you authorize us (or the applicable app
        store) to charge the payment method you provide on a recurring
        basis until you cancel. Subscriptions can be managed and cancelled
        through your Apple ID or Google Play account settings. Except where
        required by law, payments are non-refundable.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time
        from the{" "}
        <a href="/delete-account">Delete account</a> page or from inside the
        app. We may suspend or terminate your access if you violate these
        Terms or if we are required to do so by law. Upon termination, your
        right to use the Service ends.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
        WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
        LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE
        SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT THE NUTRITIONAL
        INFORMATION PROVIDED IS COMPLETE OR ACCURATE.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, BITEIQ SHALL NOT BE LIABLE
        FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
        DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, ARISING FROM YOUR USE
        OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR
        RELATING TO THESE TERMS OR THE SERVICE IS LIMITED TO THE GREATER OF
        (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE MONTHS
        BEFORE THE CLAIM AROSE, OR (B) USD $25.
      </p>

      <h2>13. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless BiteIQ from any claim,
        liability, or expense (including reasonable attorneys' fees)
        arising out of your violation of these Terms or your misuse of the
        Service.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware,
        without regard to conflict of law principles. Any dispute arising
        out of or relating to these Terms or the Service shall be resolved
        in the state or federal courts located in Delaware, and you consent
        to personal jurisdiction in those courts.
      </p>

      <h2>15. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. If we make material
        changes, we will notify you in the app or by email. Your continued
        use of the Service after the changes take effect means you accept
        the updated Terms.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href="mailto:support@biteiq.tech">support@biteiq.tech</a>.
      </p>
    </PolicyPage>
  );
}
