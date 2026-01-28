"use client";

import { motion } from "framer-motion";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="spotlight-purple" />
      <div className="spotlight-blue" />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <FileText className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold text-white">Terms & Conditions</h1>
          </div>
          <p className="text-gray-400 text-lg md:text-xl">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-invert max-w-4xl mx-auto"
        >
          <div className="space-y-12 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using FluxCode, you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Contest Rules</h2>
              <h3 className="text-xl font-semibold text-white mb-3">Entry Fee & Participation</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>All contests require an entry fee as specified</li>
                <li>Participants must maintain a valid LeetCode account</li>
                <li>Problems must be solved on LeetCode and verified through our platform</li>
                <li>You must link your LeetCode username during onboarding</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Weekend Tests</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Weekend tests are available only on Saturdays and Sundays</li>
                <li>You must solve at least 2 out of 3 weekend problems to continue</li>
                <li>Failure to meet the requirement results in a penalty payment</li>
                <li>Penalty amounts are specified per contest</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Streaks</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Streaks are calculated based on daily problem-solving activity</li>
                <li>You must solve at least one problem per day to maintain your streak</li>
                <li>Midnight (12:00 AM) is the delimiter for daily activity</li>
                <li>Multiple solutions in one day count as one streak increment</li>
                <li>Missing a day resets your streak to 0</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Payment Terms</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All payments are processed through Razorpay</li>
                <li>Entry fees are non-refundable once a contest starts</li>
                <li>Penalty fees must be paid to continue participation</li>
                <li>We do not store your payment card information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. User Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cheat, manipulate, or exploit the verification system</li>
                <li>Use multiple accounts to participate in the same contest</li>
                <li>Share solutions or collaborate during contests</li>
                <li>Interfere with other users&apos; participation</li>
                <li>Attempt to hack, reverse engineer, or compromise our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Verification System</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We verify solutions by checking your LeetCode submission history</li>
                <li>You must solve problems on LeetCode using your linked account</li>
                <li>We check your last 20 submissions for each problem</li>
                <li>Verification may take a few seconds to complete</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Account Termination</h2>
              <p>We reserve the right to suspend or terminate accounts that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate these terms</li>
                <li>Engage in fraudulent activities</li>
                <li>Abuse or harass other users</li>
                <li>Fail to make required payments</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
              <p>All content, features, and functionality on FluxCode are owned by us and protected by copyright, trademark, and other intellectual property laws.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimer</h2>
              <p>FluxCode is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free service. Your use of the platform is at your own risk.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
              <p>We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of FluxCode.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to Terms</h2>
              <p>We may update these terms from time to time. We will notify users of significant changes via email or platform notifications.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Contact</h2>
              <p>For questions about these Terms & Conditions, contact us at:</p>
              <p className="text-primary">sushanshetty1470@gmail.com</p>
            </section>
          </div>
        </motion.div>
      </div>

    </main>
  );
}
