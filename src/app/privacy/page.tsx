"use client";

import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Footer } from "~/components/Footer";

export default function PrivacyPolicy() {
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
          className="mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">Privacy Policy</h1>
          </div>
          <p className="text-gray-400 text-lg">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose prose-invert max-w-4xl"
        >
          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create an account and use our services</li>
                <li>Participate in contests and solve problems</li>
                <li>Link your LeetCode account for verification</li>
                <li>Make payments through our platform</li>
                <li>Contact us for support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your contest participation and payments</li>
                <li>Verify your LeetCode problem submissions</li>
                <li>Send you technical notices and support messages</li>
                <li>Track your progress and display on leaderboards</li>
                <li>Detect and prevent fraud or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Information Sharing</h2>
              <p>We do not sell your personal information. We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> Payment processors (Razorpay), authentication services (Supabase)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Public Display:</strong> Contest rankings and progress (username and stats only)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of promotional communications</li>
                <li>Request a copy of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies and Tracking</h2>
              <p>We use cookies and similar tracking technologies to provide and improve our services. You can control cookies through your browser settings.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Children&apos;s Privacy</h2>
              <p>Our services are not intended for users under 13 years of age. We do not knowingly collect information from children under 13.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at:</p>
              <p className="text-primary">support@fluxcode.dev</p>
            </section>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
