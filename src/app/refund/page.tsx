"use client";

import { motion } from "framer-motion";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Footer } from "~/components/Footer";

export default function RefundPolicy() {
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
            <RefreshCw className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">Refund Policy</h1>
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
              <h2 className="text-2xl font-semibold text-white mb-4">1. Contest Entry Fees</h2>
              <h3 className="text-xl font-semibold text-white mb-3">Non-Refundable</h3>
              <p>Contest entry fees are <strong className="text-white">non-refundable</strong> under the following conditions:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Once a contest has started</li>
                <li>If you have accessed any contest problems or materials</li>
                <li>If you have participated in any way (solving problems, viewing leaderboard, etc.)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Refundable Within 24 Hours</h3>
              <p>Entry fees may be refunded if:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You request a refund within 24 hours of payment</li>
                <li>The contest has not yet started</li>
                <li>You have not accessed any contest materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Penalty Payments</h2>
              <p>Penalty payments for failing weekend tests are <strong className="text-white">non-refundable</strong> as they are:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Incurred based on your performance</li>
                <li>Required to continue participating in the contest</li>
                <li>Clearly outlined in the contest rules</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Technical Issues</h2>
              <p>If you experience technical issues that prevent you from participating:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact support immediately at <span className="text-primary">support@fluxcode.dev</span></li>
                <li>Provide detailed information about the issue</li>
                <li>We will investigate and determine eligibility for refund on a case-by-case basis</li>
              </ul>
              <p className="mt-4">Note: Technical issues on your end (internet connection, device problems) are not eligible for refunds.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Contest Cancellation</h2>
              <p>If we cancel a contest before it starts:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All participants will receive a full refund</li>
                <li>Refunds will be processed within 7-10 business days</li>
                <li>You will be notified via email</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Refund Process</h2>
              <h3 className="text-xl font-semibold text-white mb-3">How to Request</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Email <span className="text-primary">support@fluxcode.dev</span> with subject &quot;Refund Request&quot;</li>
                <li>Include your transaction ID and reason for refund</li>
                <li>Provide any supporting documentation</li>
              </ol>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">Processing Time</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Refund requests are reviewed within 3-5 business days</li>
                <li>Approved refunds are processed within 7-10 business days</li>
                <li>Refunds are issued to the original payment method</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Payment Gateway Charges</h2>
              <p>For approved refunds:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment gateway processing fees are non-refundable</li>
                <li>You will receive the amount minus any transaction fees</li>
                <li>This typically ranges from 2-3% of the transaction amount</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Disputes</h2>
              <p>If you dispute a charge with your payment provider:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your account may be suspended pending investigation</li>
                <li>Please contact us directly before initiating a chargeback</li>
                <li>We aim to resolve all disputes fairly and promptly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Exceptions</h2>
              <p>We reserve the right to issue refunds at our discretion for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Exceptional circumstances</li>
                <li>Errors on our part</li>
                <li>Issues with our platform preventing fair participation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Contact</h2>
              <p>For refund inquiries or disputes, contact us at:</p>
              <p className="text-primary">support@fluxcode.dev</p>
              <p className="mt-2">We typically respond within 24-48 hours.</p>
            </section>
          </div>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
