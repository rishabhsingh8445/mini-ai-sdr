"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Lead } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { Users, TrendingUp, Mail, Star, PlusCircle, ArrowUpRight, Building2, Zap, BarChart2, UploadCloud, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
};

// Mapping scores to semantic colors.
// We use inline styles for the border color in the UI because Tailwind doesn't 
// easily support dynamic hex code injection (e.g. `border-[${color}]`).
const getScoreColor = (score: number | null) => {
  if (score === null) return { bar: "bg-gray-200", text: "text-gray-400", borderColor: "#e5e7eb" };
  if (score >= 75)   return { bar: "bg-green-500",  text: "text-green-600",  borderColor: "#4ade80" };
  if (score >= 50)   return { bar: "bg-yellow-400", text: "text-yellow-600", borderColor: "#facc15" };
  return               { bar: "bg-red-400",    text: "text-red-500",    borderColor: "#f87171" };
};

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchLeads(); }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      await api.post("/api/leads/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchLeads();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get<Lead[]>("/api/leads");
      setLeads(res.data);
    } catch (error) { 
      // In a production app, we'd fire this to Sentry or show a toast notification.
      console.error("Failed to fetch leads:", error);
    } finally { 
      setLoading(false); 
    }
  };

  // Derive stats from the leads array. 
  // Doing this on the client side is fine for < 1000 leads, but for a real CRM
  // this should be an aggregation query on the backend.
  const stats = {
    total: leads.length,
    qualified: leads.filter((l) => l.qualification_score !== null).length,
    hot: leads.filter((l) => (l.qualification_score ?? 0) >= 75).length,
    contacted: leads.filter((l) => l.status === "contacted").length,
  };

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-5 md:p-6 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-4 flex-shrink-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Overview of your AI SDR performance</p>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-secondary py-2 text-sm flex items-center">
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
            )}
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
          <Link href="/dashboard/leads/new" className="btn-primary py-2 text-sm flex items-center">
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Add Lead
          </Link>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center flex-1">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600" />
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col flex-1 min-h-0 gap-4"
        >
          {/* Stats row */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
            <StatCard label="Total Leads" value={stats.total} icon={Users} color="blue" delay={0} />
            <StatCard label="AI Scored" value={stats.qualified} icon={Star} color="purple" delay={0} />
            <StatCard
              label="Hot Leads" value={stats.hot} icon={TrendingUp} color="green" delay={0}
              trend={stats.total > 0 ? { value: `${Math.round((stats.hot / stats.total) * 100)}%`, positive: true } : undefined}
            />
            <StatCard label="Leads Contacted" value={stats.contacted} icon={Mail} color="yellow" delay={0} />
          </motion.div>

          {/* Main content: recent leads + quick actions */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
            {/* Recent leads */}
            <div className="lg:col-span-2 card bg-white border border-gray-200 shadow-sm flex flex-col min-h-0">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-sm font-bold text-gray-900">Recent Leads</h2>
                <Link href="/dashboard/leads" className="text-xs text-accent-600 hover:text-accent-700 font-medium flex items-center gap-0.5 transition-colors">
                  View all <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                {recentLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400">
                    <Users className="w-10 h-10 mb-2 opacity-20" />
                    <p className="text-sm">No leads yet</p>
                    <Link href="/dashboard/leads/new" className="mt-3 btn-primary text-xs py-1.5">Add your first lead</Link>
                  </div>
                ) : recentLeads.map((lead) => {
                  const cfg = getScoreColor(lead.qualification_score);
                  return (
                    <Link
                      key={lead.id}
                      href={`/dashboard/leads/${lead.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/80 transition-colors group"
                      style={{ borderLeft: `3px solid ${cfg.borderColor}` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-accent-100 border border-accent-200 flex items-center justify-center text-accent-700 text-xs font-bold flex-shrink-0 group-hover:scale-105 transition-transform">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500 truncate">{lead.company || "—"} · {lead.job_title || "—"}</span>
                        </div>
                      </div>
                      {lead.qualification_score !== null ? (
                        <div className="text-right flex-shrink-0">
                          <p className={cn("text-sm font-bold", cfg.text)}>
                            {lead.qualification_score}
                            <span className="text-gray-400 font-normal text-xs">/100</span>
                          </p>
                          <div className="h-1 w-14 bg-gray-100 rounded-full mt-1">
                            <div className={cn("h-full rounded-full", cfg.bar)} style={{ width: `${lead.qualification_score}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 flex-shrink-0">Not scored</span>
                      )}
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-accent-500 transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col gap-3">
              {[
                {
                  href: "/dashboard/analytics",
                  icon: BarChart2,
                  iconBg: "bg-blue-100 border-blue-200 group-hover:bg-blue-200",
                  iconColor: "text-blue-600",
                  hoverBorder: "hover:border-blue-300",
                  title: "View Analytics",
                  desc: "Score distribution & pipeline status",
                },
                {
                  href: "/dashboard/leads",
                  icon: Zap,
                  iconBg: "bg-purple-100 border-purple-200 group-hover:bg-purple-200",
                  iconColor: "text-purple-600",
                  hoverBorder: "hover:border-purple-300",
                  title: "Run AI Agent",
                  desc: "Open a lead and run the LangGraph pipeline",
                },
              ].map(({ href, icon: Icon, iconBg, iconColor, hoverBorder, title, desc }) => (
                <motion.div key={href} whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Link href={href} className={cn("flex items-start gap-3 p-4 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-all duration-200 group block", hoverBorder)}>
                    <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors", iconBg)}>
                      <Icon className={cn("w-5 h-5", iconColor)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
