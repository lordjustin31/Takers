import { FileText } from "lucide-react"

function TermsPage() {
  return (
    <div className="min-h-screen bg-neu-50 pb-20 pt-24">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="neu-card mb-8 p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 shadow-glow">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neu-900">Terms & Conditions</h1>
              <p className="text-sm text-neu-600 mt-1">Last updated: July 7, 2026</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="neu-card p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-neu-700">
              By accessing and using Takers Marketplace ("the Platform"), you accept and agree to be bound by these 
              Terms and Conditions. If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">2. User Eligibility</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-neu-700">
              <li>You must be at least 18 years old to use this Platform</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>One account per person - no multiple accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">3. User Accounts</h2>
            <div className="space-y-3 text-neu-700">
              <h3 className="font-semibold text-lg text-neu-800">3.1 Account Security</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You are responsible for all activities under your account</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of unauthorized access</li>
                <li>We are not liable for losses from unauthorized use</li>
              </ul>

              <h3 className="font-semibold text-lg text-neu-800 mt-4">3.2 Account Termination</h3>
              <p>We may suspend or terminate accounts that violate these terms.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">4. Platform Use</h2>
            <div className="space-y-3 text-neu-700">
              <h3 className="font-semibold text-lg text-neu-800">4.1 Permitted Use</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Buy and sell legitimate products and services</li>
                <li>Communicate with other users respectfully</li>
                <li>Post accurate product descriptions and images</li>
                <li>Honor transactions and commitments</li>
              </ul>

              <h3 className="font-semibold text-lg text-neu-800 mt-4">4.2 Prohibited Activities</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Illegal Items:</strong> No weapons, drugs, stolen goods, counterfeit items</li>
                <li><strong>Fraud:</strong> No scams, false information, or deceptive practices</li>
                <li><strong>Abuse:</strong> No harassment, hate speech, or threatening behavior</li>
                <li><strong>Spam:</strong> No unsolicited messages or excessive posting</li>
                <li><strong>Intellectual Property:</strong> No copyright/trademark infringement</li>
                <li><strong>Hacking:</strong> No attempts to breach security or reverse engineer</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">5. Listings and Transactions</h2>
            <div className="space-y-3 text-neu-700">
              <h3 className="font-semibold text-lg text-neu-800">5.1 Seller Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate product descriptions and images</li>
                <li>Set fair and honest prices</li>
                <li>Respond to inquiries promptly</li>
                <li>Honor sales and deliver as promised</li>
                <li>Only sell items you legally own</li>
              </ul>

              <h3 className="font-semibold text-lg text-neu-800 mt-4">5.2 Buyer Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Read product descriptions carefully</li>
                <li>Communicate clearly with sellers</li>
                <li>Complete transactions as agreed</li>
                <li>Report issues promptly</li>
              </ul>

              <h3 className="font-semibold text-lg text-neu-800 mt-4">5.3 Platform Role</h3>
              <p>
                Takers Marketplace is a <strong>platform only</strong>. We connect buyers and sellers but are 
                NOT a party to transactions. Users transact directly with each other.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">6. Fees and Payments</h2>
            <p className="text-neu-700">
              Currently, Takers Marketplace is <strong>free to use</strong>. We reserve the right to introduce 
              fees in the future with 30 days notice. Payment processing for transactions is handled between 
              users directly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">7. Refunds and Disputes</h2>
            <div className="space-y-3 text-neu-700">
              <h3 className="font-semibold text-lg text-neu-800">7.1 Refund Policy</h3>
              <p>
                Refunds are determined by individual sellers. As a platform, we do NOT process payments or 
                refunds. Buyers and sellers must resolve refund issues directly.
              </p>

              <h3 className="font-semibold text-lg text-neu-800 mt-4">7.2 Dispute Resolution</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Users should first attempt to resolve disputes directly</li>
                <li>Report issues through our dispute system if unable to resolve</li>
                <li>Admins may review and mediate disputes</li>
                <li>Admin decisions are final</li>
                <li>We may ban users who repeatedly violate policies</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">8. Intellectual Property</h2>
            <div className="space-y-3 text-neu-700">
              <h3 className="font-semibold text-lg text-neu-800">8.1 Platform Content</h3>
              <p>
                All Platform code, design, logos, and trademarks are owned by Takers Marketplace. 
                Users may not copy, modify, or distribute Platform content without permission.
              </p>

              <h3 className="font-semibold text-lg text-neu-800 mt-4">8.2 User Content</h3>
              <p>
                You retain ownership of content you post (listings, images, comments). By posting, you grant 
                us a license to display and distribute your content on the Platform.
              </p>

              <h3 className="font-semibold text-lg text-neu-800 mt-4">8.3 Copyright Infringement</h3>
              <p>
                If you believe your copyright has been infringed, contact us at: <strong>dmca@takers-marketplace.com</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">9. Disclaimers</h2>
            <div className="neu-card-inset p-4 bg-amber-50 border-2 border-amber-200">
              <ul className="list-disc list-inside space-y-2 ml-4 text-neu-800">
                <li>Platform provided "AS IS" without warranties</li>
                <li>We do not guarantee item quality, safety, or legality</li>
                <li>We are not responsible for user conduct or transactions</li>
                <li>Service may be interrupted or unavailable</li>
                <li>Users assume all risks of using the Platform</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">10. Limitation of Liability</h2>
            <div className="text-neu-700 space-y-2">
              <p>
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Our total liability shall not exceed ₱1,000 or amount paid to us (if any)</li>
                <li>We are not liable for user conduct, transactions, or third-party content</li>
                <li>We are not liable for data loss, security breaches, or service interruptions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">11. Indemnification</h2>
            <p className="text-neu-700">
              You agree to indemnify and hold harmless Takers Marketplace from any claims, damages, or expenses 
              arising from your use of the Platform, violation of these terms, or infringement of third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">12. Changes to Terms</h2>
            <p className="text-neu-700">
              We may modify these terms at any time. Significant changes will be notified via email or platform 
              notification 30 days in advance. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">13. Governing Law</h2>
            <p className="text-neu-700">
              These terms are governed by the laws of the Philippines. Disputes shall be resolved in 
              Philippine courts. Users agree to submit to the jurisdiction of Philippine courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-neu-900 mb-4">14. Contact</h2>
            <div className="neu-card-inset p-4 bg-blue-50">
              <p className="text-neu-700">For questions about these terms:</p>
              <p className="font-semibold text-neu-900 mt-2">legal@takers-marketplace.com</p>
              <p className="text-sm text-neu-600 mt-1">Response time: 3-5 business days</p>
            </div>
          </section>

          <div className="border-t border-neu-200 pt-6 mt-8">
            <p className="text-sm text-neu-500 text-center">
              By using Takers Marketplace, you agree to these Terms & Conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsPage
