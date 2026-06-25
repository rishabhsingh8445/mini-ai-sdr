"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  delay?: number;
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  green: "bg-green-50 text-green-600 border-green-100",
  yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
  red: "bg-red-50 text-red-600 border-red-100",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
};

export function StatCard({ label, value, icon: Icon, trend, color = "blue", delay = 0 }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="card p-6 flex items-start justify-between relative overflow-hidden group"
    >
      <div className="relative z-10">
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <motion.p 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
          className="text-3xl font-bold text-gray-900 tracking-tight"
        >
          {value}
        </motion.p>
        {trend && (
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.3 }}
            className={cn("text-xs mt-2 font-semibold flex items-center gap-1", trend.positive ? "text-green-600" : "text-red-600")}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </motion.p>
        )}
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border relative z-10 transition-transform duration-500 group-hover:scale-110", colorMap[color])}>
        <Icon className="w-6 h-6" />
      </div>
    </motion.div>
  );
}
