"use client";

import { motion } from "framer-motion";
import { Mail, Github, Twitter, MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Contact() {
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
          className="text-center mb-12 sm:mb-16 max-w-3xl mx-auto px-4"
        >
          <div className="inline-flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white">Contact Us</h1>
          </div>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl leading-relaxed">
            Have questions or need support? We&apos;re here to help. Reach out to us through any of these channels.
          </p>
        </motion.div>

        {/* Contact Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4"
        >
          {/* Email Support */}
          <a
            href="mailto:sushanshetty1470@gmail.com"
            className="group p-8 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/40 backdrop-blur-sm transition-all hover:scale-105"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Sushan Shetty</h3>
                <p className="text-gray-400 mb-3">For general inquiries and support</p>
                <p className="text-primary font-medium">sushanshetty1470@gmail.com</p>
              </div>
            </div>
          </a>

          {/* GitHub */}
          <a
            href="https://github.com/ashtonmths/fluxcode"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-8 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/40 backdrop-blur-sm transition-all hover:scale-105"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Github className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">GitHub</h3>
                <p className="text-gray-400 mb-3">Report issues and contribute</p>
                <p className="text-primary font-medium">github.com/ashtonmths/fluxcode</p>
              </div>
            </div>
          </a>

          {/* Twitter */}
          <a
            href="https://twitter.com/fluxcode"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-8 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/40 backdrop-blur-sm transition-all hover:scale-105"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Twitter className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Twitter</h3>
                <p className="text-gray-400 mb-3">Follow us for updates</p>
                <p className="text-primary font-medium">@fluxcode</p>
              </div>
            </div>
          </a>

          {/* Business Inquiries */}
          <a
            href="mailto:ashtonmths@outlook.com"
            className="group p-8 rounded-2xl bg-primary/5 border border-primary/20 hover:border-primary/40 backdrop-blur-sm transition-all hover:scale-105"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Ashton Mathias</h3>
                <p className="text-gray-400 mb-3">Partnerships and collaborations</p>
                <p className="text-primary font-medium">ashtonmths@outlook.com</p>
              </div>
            </div>
          </a>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-3xl mx-auto mt-20 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Response Time</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            We typically respond to all inquiries within 24-48 hours during business days. 
            For urgent matters, please mention &quot;URGENT&quot; in your email subject line.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
