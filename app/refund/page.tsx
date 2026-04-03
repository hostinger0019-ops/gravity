import LegalLayout from "@/components/LegalLayout";

export const metadata = {
  title: "Refund Policy | Agent Forja",
  description: "Refund Policy for Agent Forja AI chatbot platform",
};

export default function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" active="/refund">
      <h2>1. Overview</h2>
      <p>
        We want you to be fully satisfied with Agent Forja. All payments are processed by <strong>Lemon Squeezy</strong>, our Merchant of Record. Refund requests are handled in accordance with this policy and processed through Lemon Squeezy.
      </p>

      <h2>2. Subscription Plans</h2>

      <h3>2.1 Monthly Subscriptions</h3>
      <p>
        Monthly subscriptions can be cancelled at any time. Upon cancellation, you will retain access to paid features until the end of your current billing period. <strong>No refunds</strong> are issued for partial months.
      </p>

      <h3>2.2 Annual Subscriptions</h3>
      <p>
        Annual subscriptions may be refunded within <strong>14 days</strong> of purchase if you have not exceeded 100 AI credits during that period. After 14 days, no refunds are available, but you may cancel to prevent future renewal.
      </p>

      <h2>3. Lifetime Deals</h2>
      <p>Lifetime deal purchases are eligible for a full refund within <strong>30 days</strong> of purchase, provided:</p>
      <ul>
        <li>You have not created more than 2 chatbots</li>
        <li>You have not used more than 500 AI credits</li>
        <li>You have not embedded a chatbot on a live production website</li>
      </ul>
      <p>After 30 days or if the above conditions are not met, lifetime deal purchases are <strong>non-refundable</strong>.</p>

      <h2>4. Free Credits</h2>
      <p>
        The 50 free credits provided upon signup are complimentary and non-refundable. They cannot be exchanged for cash or transferred to another account.
      </p>

      <h2>5. Credit Purchases</h2>
      <p>
        One-time credit purchases are <strong>non-refundable</strong> once credits have been applied to your account. Unused credits do not expire.
      </p>

      <h2>6. Service Issues</h2>
      <p>
        If you experience a service outage lasting more than 24 consecutive hours, you may be eligible for a pro-rata credit on your next billing cycle. To claim, contact us within 7 days of the incident with details of the issue.
      </p>

      <h2>7. How to Request a Refund</h2>
      <p>To request a refund:</p>
      <ol>
        <li>Email us at <strong>support@agentforja.com</strong> with the subject line "Refund Request"</li>
        <li>Include your registered email address and order/transaction ID</li>
        <li>Describe the reason for your refund request</li>
      </ol>
      <p>
        We will review your request and respond within <strong>5 business days</strong>. Approved refunds are processed within <strong>7-10 business days</strong> to the original payment method.
      </p>

      <h2>8. Chargebacks</h2>
      <p>
        If you initiate a chargeback or payment dispute without first contacting us, your account will be immediately suspended. We encourage you to contact our support team to resolve any billing issues before disputing with your bank.
      </p>

      <h2>9. Contact</h2>
      <p>
        For refund-related questions, contact us at: <strong>support@agentforja.com</strong>
      </p>
    </LegalLayout>
  );
}
