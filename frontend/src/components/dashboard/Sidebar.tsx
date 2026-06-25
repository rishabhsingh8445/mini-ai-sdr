"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { clearAuth, getUser } from "@/lib/auth";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  PlusCircle,
  Zap,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export function Sidebar() {
  const pathname = usePathname();
  const safePathname = pathname || "";
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 relative overflow-hidden shadow-sm"
    >
      <div className="p-6 border-b border-gray-100 relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-accent-600 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900 group-hover:text-accent-600 transition-colors duration-300">Mini AI SDR</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative z-10 custom-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Link
            href="/dashboard/leads/new"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-accent-700 bg-accent-50 border border-accent-200 rounded-xl hover:bg-accent-100 hover:border-accent-300 transition-all duration-200"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Lead
          </Link>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5 relative"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = safePathname === item.href;
            return (
              <motion.div key={item.href} variants={itemVariants} className="relative">
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-gray-100 border-l-4 border-accent-600 rounded-r-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 z-10",
                    isActive
                      ? "text-accent-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-accent-600" : "text-gray-400")} />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="pt-6"
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">
            Leads
          </p>
          <div className="relative">
            {safePathname.startsWith("/dashboard/leads") && !safePathname.includes("analytics") && !safePathname.includes("new") && (
              <motion.div 
                layoutId="activeNavIndicator"
                className="absolute inset-0 bg-gray-100 border-l-4 border-accent-600 rounded-r-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <Link
              href="/dashboard/leads"
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 z-10",
                safePathname.startsWith("/dashboard/leads") && !safePathname.includes("analytics") && !safePathname.includes("new")
                  ? "text-accent-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <Users className={cn("w-5 h-5 flex-shrink-0 transition-colors", safePathname.startsWith("/dashboard/leads") && !safePathname.includes("analytics") && !safePathname.includes("new") ? "text-accent-600" : "text-gray-400")} />
              All Leads
            </Link>
          </div>
        </motion.div>
      </nav>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="p-4 border-t border-gray-200 relative z-10 bg-gray-50 m-4 rounded-xl shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-accent-100 text-accent-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold">
              {user?.full_name?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.full_name ?? "User"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </motion.div>
    </motion.aside>
  );
}
