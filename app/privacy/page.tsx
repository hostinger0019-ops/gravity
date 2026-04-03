import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Privacy Policy | Agent Forja",
  description: "Privacy Policy for Agent Forja AI chatbot platform",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" active="/privacy">
      <h2>1. Introduction</h2>
      <p>
        Agent Forja ("we", "us", "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our AI chatbot platform at <strong>agentforja.com</strong>.
      </p>

      <h2>2. Information We Collect</h2>

      <h3>2.1 Account Information</h3>
      <ul>
        <li><strong>Email address</strong> — required for account creation and OTP login</li>
        <li><strong>Name and profile picture</strong> — if you sign in via Google OAuth</li>
        <li><strong>Payment information</strong> — processed by our payment provider (Stripe/Razorpay); we do not store card details</li>
      </ul>

      <h3>2.2 Chatbot Data</h3>
      <ul>
        <li><strong>Knowledge base content</strong> — documents, URLs, and text you upload to train your chatbots</li>
        <li><strong>Chatbot configurations</strong> — name, theme, system prompts, personality settings</li>
        <li><strong>Conversation logs</strong> — messages between your chatbot and its end users</li>
        <li><strong>Lead capture data</strong> — names, emails, and other data collected through lead forms</li>
      </ul>

      <h3>2.3 Automatically Collected Data</h3>
      <ul>
        <li><strong>Usage analytics</strong> — pages visited, features used, session duration</li>
        <li><strong>Device information</strong> — browser type, OS, screen resolution</li>
        <li><strong>IP address</strong> — for security and abuse prevention</li>
        <li><strong>Cookies</strong> — for session management and authentication</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li><strong>Provide the Service</strong> — process your chatbot queries, manage your account</li>
        <li><strong>Authentication</strong> — verify your identity via email OTP or Google OAuth</li>
        <li><strong>Communication</strong> — send OTP codes, service updates, and billing notifications</li>
        <li><strong>Improvement</strong> — analyze usage patterns to improve features and performance</li>
        <li><strong>Security</strong> — detect and prevent fraud, abuse, and unauthorized access</li>
        <li><strong>Legal compliance</strong> — comply with applicable laws and regulations</li>
      </ul>

      <h2>4. Data Storage & Security</h2>

      <h3>4.1 Where We Store Your Data</h3>
      <p>
        Your data is stored on secure servers. AI processing occurs on our dedicated GPU infrastructure. We use industry-standard security measures including:
      </p>
      <ul>
        <li>HTTPS/TLS encryption for all data in transit</li>
        <li>API key authentication for internal service communication</li>
        <li>Session-based authentication with secure cookies</li>
        <li>Regular security audits and updates</li>
      </ul>

      <h3>4.2 Data Retention</h3>
      <ul>
        <li><strong>Account data</strong> — retained while your account is active, deleted within 30 days of account closure</li>
        <li><strong>Conversation logs</strong> — retained while your chatbot is active; you can delete conversations at any time</li>
        <li><strong>Knowledge base</strong> — retained while your chatbot is active; deleted when the chatbot is removed</li>
      </ul>

      <h2>5. AI Processing & Third-Party Services</h2>

      <h3>5.1 AI Model Providers</h3>
      <p>
        To generate chatbot responses, we may route queries through third-party AI inference providers including:
      </p>
      <ul>
        <li><strong>Groq</strong> — for fast AI inference</li>
        <li><strong>Self-hosted models</strong> — running on our dedicated GPU servers</li>
      </ul>
      <p>
        When using third-party providers, your chatbot queries are sent to their servers for processing. These providers have their own privacy policies and do not use your data for training.
      </p>

      <h3>5.2 Other Third-Party Services</h3>
      <ul>
        <li><strong>Google OAuth</strong> — for social login (governed by Google's Privacy Policy)</li>
        <li><strong>Hostinger SMTP</strong> — for sending OTP emails</li>
        <li><strong>Payment processors</strong> — for handling payments (Stripe/Razorpay)</li>
      </ul>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of your personal data</li>
        <li><strong>Correction</strong> — update or correct inaccurate data</li>
        <li><strong>Deletion</strong> — request deletion of your account and data</li>
        <li><strong>Export</strong> — download your chatbot data and conversation logs</li>
        <li><strong>Restrict processing</strong> — limit how we use your data</li>
        <li><strong>Withdraw consent</strong> — opt out of optional data processing</li>
      </ul>
      <p>
        To exercise these rights, contact us at <strong>support@agentforja.com</strong>. We will respond within 30 days.
      </p>

      <h2>7. Cookies</h2>
      <p>We use the following cookies:</p>
      <ul>
        <li><strong>Authentication cookies</strong> — essential for keeping you logged in (next-auth.session-token)</li>
        <li><strong>Preference cookies</strong> — remember your settings (theme, language)</li>
      </ul>
      <p>We do not use advertising or third-party tracking cookies.</p>

      <h2>8. Children's Privacy</h2>
      <p>
        Agent Forja is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we learn that a minor has provided personal information, we will delete it promptly.
      </p>

      <h2>9. International Data Transfers</h2>
      <p>
        If you access the Service from outside India, your data may be transferred to and processed in India. By using the Service, you consent to this transfer.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be notified via email or in-app notification. The "Last updated" date at the top reflects the most recent revision.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        For privacy-related questions or requests, contact us at:
      </p>
      <ul>
        <li><strong>Email:</strong> support@agentforja.com</li>
        <li><strong>Website:</strong> <a href="https://agentforja.com">agentforja.com</a></li>
      </ul>
    </LegalLayout>
  );
}
