import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Refund Policy | Agent Forja",
  description: "Refund Policy for Agent Forja AI agent platform",
};

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" active="/refund">
      <h2>1. Overview</h2>
      <p>
        We want you to be fully satisfied with Agent Forja. All payments are processed by <strong>Lemon Squeezy</strong>, our Merchant of Record. This Refund Policy outlines the conditions under which refunds are available.
      </p>

      <h2>2. Free Plan — Try Before You Buy</h2>
      <p>
        Every new user receives a <strong>free plan with 14 days of access and 500 AI credits</strong> — no credit card required. This allows you to fully explore and evaluate Agent Forja&apos;s features, including AI-powered chat agent creation, knowledge base management, and conversation analytics.
      </p>
      <p>
        We strongly encourage all users to <strong>start with the free plan</strong> and thoroughly test the Service before upgrading to a paid plan. This ensures you are fully satisfied with our platform before making any purchase.
      </p>

      <h2>3. Lifetime Deal Plans — 14-Day Money-Back Guarantee</h2>
      <p>
        All lifetime deal purchases come with a <strong>14-day money-back guarantee</strong>. If you are unsatisfied with the Service for any reason within 14 days of purchase, we will process a full refund — no questions asked.
      </p>
      <p>To request a refund:</p>
      <ol>
        <li>Email us at <strong>support@agentforja.com</strong> within 14 days of purchase</li>
        <li>Include your registered email address and order/transaction ID</li>
        <li>We will process your refund within <strong>5-7 business days</strong> via Lemon Squeezy</li>
      </ol>
      <p>
        After the 14-day period, lifetime deal purchases are <strong>non-refundable</strong>.
      </p>

      <h2>4. Monthly &amp; Annual Plans ($49 / $149)</h2>
      <p>
        Since every user has access to a <strong>free plan with 14 days and 500 credits</strong> to evaluate the Service before upgrading, paid subscription plans ($49/month and $149/month) are <strong>non-refundable</strong>.
      </p>
      <p>
        You may cancel your subscription at any time. Upon cancellation, you will retain access to paid features until the end of your current billing period. No partial refunds are issued for unused time within a billing cycle.
      </p>

      <h2>5. Free Credits</h2>
      <p>
        The free credits provided upon signup are complimentary and non-refundable. They cannot be exchanged for cash or transferred to another account.
      </p>

      <h2>6. Service Issues</h2>
      <p>
        If you experience a significant service outage lasting more than 24 consecutive hours, you may be eligible for a pro-rata credit on your next billing cycle. To claim, contact us within 7 days of the incident with details of the issue.
      </p>

      <h2>7. How to Request a Refund</h2>
      <p>To request a refund for an eligible purchase:</p>
      <ol>
        <li>Email us at <strong>support@agentforja.com</strong> with the subject line &quot;Refund Request&quot;</li>
        <li>Include your registered email address and order/transaction ID</li>
        <li>Describe the reason for your refund request</li>
      </ol>
      <p>
        We will review your request and respond within <strong>5 business days</strong>. Approved refunds are processed through Lemon Squeezy within <strong>7-10 business days</strong> to the original payment method.
      </p>

      <h2>8. Chargebacks</h2>
      <p>
        If you initiate a chargeback or payment dispute without first contacting us, your account will be immediately suspended. We encourage you to contact our support team to resolve any billing issues before disputing with your bank.
      </p>

      <h2>9. Contact</h2>
      <p>
        Agent Forja is operated by <strong>Tarik Fashion Company</strong>. For refund-related questions, contact us at: <strong>support@agentforja.com</strong>
      </p>
    </LegalLayout>
  );
}
