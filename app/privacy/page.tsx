import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Privacy Policy | Agent Forja",
  description: "Privacy Policy for Agent Forja AI agent platform",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" active="/privacy">
      <h2>1. Introduction</h2>
      <p>
        Agent Forja ("we", "us", "our"), a product operated by <strong>Tarik Fashion Company</strong>, respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our AI-powered chat agent platform at <strong>agentforja.com</strong>.
      </p>

      <h2>2. Information We Collect</h2>

      <h3>2.1 Account Information</h3>
      <ul>
        <li><strong>Email address</strong> — required for account creation and OTP login</li>
        <li><strong>Name and profile picture</strong> — if you sign in via Google OAuth</li>
        <li><strong>Payment information</strong> — processed by <a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer">Lemon Squeezy</a>, our Merchant of Record; we do not store card or payment details</li>
      </ul>

      <h3>2.2 AI Agent Data</h3>
      <ul>
        <li><strong>Knowledge base content</strong> — documents, URLs, and text you upload to train your AI agents</li>
        <li><strong>Agent configurations</strong> — name, theme, system prompts, personality settings</li>
        <li><strong>Conversation logs</strong> — messages between your AI agent and its end users</li>
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
        <li><strong>Provide the Service</strong> — process your AI agent queries, manage your account</li>
        <li><strong>Authentication</strong> — verify your identity via email OTP or Google OAuth</li>
        <li><strong>Communication</strong> — send OTP codes, service updates, and billing notifications</li>
        <li><strong>Improvement</strong> — analyze usage patterns to improve features and performance</li>
        <li><strong>Security</strong> — detect and prevent fraud, abuse, and unauthorized access</li>
        <li><strong>Legal compliance</strong> — comply with applicable laws and regulations</li>
      </ul>

      <h2>4. Administrative Access to Your Data</h2>
      <p>
        Our authorized personnel may access your account data, agent configurations, knowledge base content, and conversation logs for the following purposes:
      </p>
      <ul>
        <li><strong>Service delivery</strong> — providing, maintaining, and improving the Service</li>
        <li><strong>Technical support</strong> — diagnosing and resolving technical issues reported by you</li>
        <li><strong>Abuse prevention</strong> — detecting, investigating, and preventing fraud, spam, or violations of our Terms of Service</li>
        <li><strong>Plan enforcement</strong> — monitoring usage against subscription limits</li>
        <li><strong>Legal obligations</strong> — complying with lawful requests from authorities</li>
      </ul>
      <p>
        Access is restricted to employees and contractors who require it to perform their job functions, on a <strong>minimum necessary basis</strong>. We do not access your data for marketing purposes, sell your data, or share it with third parties except as described in this policy.
      </p>

      <h2>5. Data Storage &amp; Security</h2>

      <h3>5.1 Where We Store Your Data</h3>
      <p>
        Your data is stored on secure servers located in <strong>Canada</strong>. AI inference occurs on our dedicated GPU infrastructure hosted in Canada. We use industry-standard security measures including:
      </p>
      <ul>
        <li>HTTPS/TLS encryption for all data in transit</li>
        <li>API key authentication for internal service communication</li>
        <li>Session-based authentication with secure cookies</li>
        <li>Regular security audits and updates</li>
      </ul>

      <h3>5.2 Data Retention</h3>
      <ul>
        <li><strong>Account data</strong> — retained while your account is active, deleted within 30 days of account closure</li>
        <li><strong>Conversation logs</strong> — retained while your AI agent is active; you can delete conversations at any time</li>
        <li><strong>Knowledge base</strong> — retained while your AI agent is active; deleted when the agent is removed</li>
      </ul>

      <h2>6. AI Processing &amp; Third-Party Services</h2>

      <h3>6.1 AI Model Providers</h3>
      <p>
        To generate AI agent responses, we may route queries through third-party AI inference providers including:
      </p>
      <ul>
        <li><strong>Groq</strong> — for fast AI inference (<a href="https://groq.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Groq Privacy Policy</a>)</li>
        <li><strong>Self-hosted models</strong> — running on our dedicated GPU servers in Canada</li>
      </ul>
      <p>
        When using Groq, your AI agent queries are sent to their servers for processing. Groq does not use your data for model training. We do not share your data with any other third parties for AI processing.
      </p>

      <h3>6.2 Other Third-Party Services</h3>
      <ul>
        <li><strong>Lemon Squeezy</strong> — Merchant of Record for all payments, billing, and tax collection (<a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer">Lemon Squeezy Privacy Policy</a>)</li>
        <li><strong>Google OAuth</strong> — for social login (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>)</li>
        <li><strong>Hostinger SMTP</strong> — for sending OTP and transactional emails</li>
      </ul>
      <p>
        We do not sell, rent, or share your personal data with any third parties for advertising or marketing purposes.
      </p>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> — request a copy of your personal data</li>
        <li><strong>Correction</strong> — update or correct inaccurate data</li>
        <li><strong>Deletion</strong> — request deletion of your account and data</li>
        <li><strong>Export</strong> — download your AI agent data and conversation logs</li>
        <li><strong>Restrict processing</strong> — limit how we use your data</li>
        <li><strong>Withdraw consent</strong> — opt out of optional data processing</li>
      </ul>
      <p>
        To exercise these rights, contact us at <strong>support@agentforja.com</strong>. We will respond within 30 days.
      </p>
      <p>
        If you are located in the European Union, you have additional rights under the GDPR including the right to data portability and the right to lodge a complaint with a supervisory authority. If you are a California resident, you have rights under the CCPA including the right to know what personal information is collected and the right to opt out of the sale of personal information (we do not sell your data).
      </p>

      <h2>8. Cookies</h2>
      <p>We use the following cookies:</p>
      <ul>
        <li><strong>Authentication cookies</strong> — essential for keeping you logged in (next-auth.session-token)</li>
        <li><strong>Preference cookies</strong> — remember your settings (theme, language)</li>
      </ul>
      <p>We do not use advertising or third-party tracking cookies.</p>

      <h2>9. Children&apos;s Privacy</h2>
      <p>
        Agent Forja is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we learn that a minor has provided personal information, we will delete it promptly.
      </p>

      <h2>10. International Data Transfers</h2>
      <p>
        Your data is stored and processed on servers located in <strong>Canada</strong>. If you access the Service from outside Canada, your data will be transferred to and processed in Canada. Canada has been recognized by the European Commission as providing an adequate level of data protection. By using the Service, you consent to this transfer.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be notified via email or in-app notification. The "Last updated" date at the top reflects the most recent revision.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        Agent Forja is operated by <strong>Tarik Fashion Company</strong>. For privacy-related questions or requests, contact us at:
      </p>
      <ul>
        <li><strong>Email:</strong> support@agentforja.com</li>
        <li><strong>Website:</strong> <a href="https://agentforja.com">agentforja.com</a></li>
      </ul>
    </LegalLayout>
  );
}
