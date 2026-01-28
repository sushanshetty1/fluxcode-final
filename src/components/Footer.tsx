import Link from "next/link";
import { Code2, Mail, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-white">FluxCode</span>
            </div>
            <p className="text-sm text-gray-400">
              Master data structures & algorithms through competitive long-term contests.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contests" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Contests
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a href="mailto:sushanshetty1470@gmail.com" className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  sushanshetty1470@gmail.com
                </a>
              </li>
              <li>
                <a href="https://github.com/fluxcode" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://twitter.com/fluxcode" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} FluxCode. All rights reserved.
            </p>
            <p className="text-sm text-gray-400">
              Built with 💜 for the coding community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
