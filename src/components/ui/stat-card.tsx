"use client";

import { cn } from "~/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ icon, label, value, trend, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-2xl p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/30 transition-all duration-300 group overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          {trend && (
            <span className={cn(
              "text-sm font-semibold",
              trend.isPositive ? "text-green-400" : "text-red-400"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
          )}
        </div>
        
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-white/60 uppercase tracking-wider">{label}</div>
      </div>
    </motion.div>
  );
}
