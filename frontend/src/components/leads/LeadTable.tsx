import Link from "next/link";
import { ArrowUpRight, Building2, Mail, Star } from "lucide-react";
import { Lead } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LeadTableProps {
  leads: Lead[];
}

// A helper to quickly badge leads based on their status enum from the DB.
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "new":      return "bg-blue-50 text-blue-700 border-blue-200";
    case "qualified": return "bg-green-50 text-green-700 border-green-200";
    case "disqualified": return "bg-red-50 text-red-700 border-red-200";
    case "contacted": return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:         return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

// Returns a configuration object containing Tailwind classes and a raw hex color.
// The raw hex color is used for inline styles where Tailwind dynamic classes fail to compile.
const getScoreConfig = (score: number | null) => {
  if (score === null) return { text: "text-gray-400", bar: "bg-gray-200", borderColor: "#e5e7eb", avatar: "bg-gray-100 text-gray-500 border-gray-200" };
  if (score >= 75)   return { text: "text-green-600", bar: "bg-green-500", borderColor: "#4ade80", avatar: "bg-accent-100 text-accent-700 border-accent-200" };
  if (score >= 50)   return { text: "text-yellow-600", bar: "bg-yellow-400", borderColor: "#facc15", avatar: "bg-accent-100 text-accent-700 border-accent-200" };
  return               { text: "text-red-500",   bar: "bg-red-400",   borderColor: "#f87171", avatar: "bg-accent-100 text-accent-700 border-accent-200" };
};

const tableVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

export function LeadTable({ leads }: LeadTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-50 text-gray-400 border-b border-gray-200 uppercase tracking-wider text-[10px] font-bold">
          <tr>
            <th className="px-6 py-3.5">Name / Contact</th>
            <th className="px-6 py-3.5">Company &amp; Role</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">AI Score</th>
            <th className="px-6 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <motion.tbody
          variants={tableVariants}
          initial="hidden"
          animate="visible"
          className="divide-y divide-gray-100 bg-white"
        >
          {leads.map((lead) => {
            const cfg = getScoreConfig(lead.qualification_score);
            return (
              <motion.tr
                variants={rowVariants}
                key={lead.id}
                className="hover:bg-gray-50/80 transition-colors group relative"
                style={{ borderLeft: `3px solid ${cfg.borderColor}` }}
              >
                {/* Name */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border transition-all group-hover:scale-105 flex-shrink-0", cfg.avatar)}>
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{lead.name}</div>
                      <div className="text-gray-400 flex items-center gap-1 mt-0.5 text-xs">
                        <Mail className="w-3 h-3" />
                        {lead.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Company */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-1.5 text-gray-700 font-medium text-sm">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    {lead.company || "—"}
                  </div>
                  <div className="text-gray-400 text-xs mt-0.5">{lead.job_title || "—"}</div>
                </td>

                {/* Status */}
                <td className="px-6 py-3.5">
                  <span className={cn("badge text-[11px]", getStatusBadgeColor(lead.status))}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </span>
                </td>

                {/* Score + mini bar */}
                <td className="px-6 py-3.5">
                  {lead.qualification_score !== null ? (
                    <div className="min-w-[80px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Star className={cn("w-3.5 h-3.5", cfg.text)} />
                        <span className={cn("font-bold text-sm", cfg.text)}>
                          {lead.qualification_score}
                          <span className="font-normal text-gray-400 text-xs">/100</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-20 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-700", cfg.bar)}
                          style={{ width: `${lead.qualification_score}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </td>

                {/* Action */}
                <td className="px-6 py-3.5 text-right">
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="inline-flex items-center gap-1 text-accent-600 hover:text-accent-700 font-medium text-xs transition-colors bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-lg border border-accent-200"
                  >
                    View
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </td>
              </motion.tr>
            );
          })}
        </motion.tbody>
      </table>
    </div>
  );
}
