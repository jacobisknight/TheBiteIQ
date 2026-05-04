import { PolicyPage } from "@/components/PolicyPage";

export default function DeleteAccount() {
  return (
    <PolicyPage
      title="Delete your account"
      description="How to permanently delete your BiteIQ account and all associated data."
      effectiveDate="May 4, 2026"
    >
      <p>
        You can delete your BiteIQ account and all of your data at any
        time. Deletion is permanent — once your data is removed it
        cannot be recovered.
      </p>

      <h2>Option 1 — Delete from inside the app (recommended)</h2>
      <ol>
        <li>Open the BiteIQ app and sign in.</li>
        <li>
          Tap the <strong>Profile</strong> tab at the bottom.
        </li>
        <li>
          Scroll to the bottom and tap <strong>Delete account</strong>.
        </li>
        <li>
          Confirm the two prompts. Your account, profile, meals, weights,
          coach conversations, and connected-service data are removed
          immediately and you are signed out.
        </li>
      </ol>
      <p>
        This is the fastest path — deletion happens in seconds, no email
        back-and-forth required.
      </p>

      <h2>Option 2 — Email us (if you can't open the app)</h2>
      <ol>
        <li>
          Send an email from the address you used to sign up to{" "}
          <a href="mailto:privacy@biteiq.tech">privacy@biteiq.tech</a> with
          the subject line <strong>Delete my account</strong>.
        </li>
        <li>
          We'll verify the request matches an active account and reply
          within two business days.
        </li>
        <li>
          Your account is deactivated immediately and your data is
          permanently removed within 30 days. We send a confirmation email
          when deletion is complete.
        </li>
      </ol>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your account and login credentials</li>
        <li>Your profile (name, age, sex, height, weight, goal, plan)</li>
        <li>All meal entries and meal photos</li>
        <li>All weight entries</li>
        <li>All voice notes</li>
        <li>All coach conversations</li>
        <li>All saved meal and workout plans</li>
        <li>
          Connected-service tokens and synced data from Apple Health, Whoop,
          and Oura
        </li>
      </ul>

      <h2>What we may keep</h2>
      <p>
        We may retain a minimal set of records that we are legally required
        to keep, such as transaction records for accounting and tax
        purposes, or records needed to defend against legal claims. These
        records are kept in a restricted form and are not used for any
        other purpose.
      </p>

      <h2>Erase data on your device only (optional first step)</h2>
      <p>
        If you'd like to wipe your local app data without deleting your
        account, open BiteIQ → <strong>Profile</strong> tab →{" "}
        <strong>Reset all data</strong>. This clears your meals, weights,
        plan, and coach history from this device only. Your account stays
        active.
      </p>

      <h2>Subscriptions</h2>
      <p>
        Deleting your account does <strong>not</strong> automatically
        cancel an App Store subscription. To cancel a subscription, open
        Settings on your iPhone → tap your Apple ID → Subscriptions →
        BiteIQ → Cancel. Subscriptions are managed by Apple.
      </p>

      <h2>Questions</h2>
      <p>
        If you have any questions about deletion, email{" "}
        <a href="mailto:privacy@biteiq.tech">privacy@biteiq.tech</a> and
        we'll help.
      </p>
    </PolicyPage>
  );
}
