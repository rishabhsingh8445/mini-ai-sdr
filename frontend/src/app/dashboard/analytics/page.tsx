"use client";

import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { Lead } from "@/types";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Users,
  TrendingUp,
  Star,
  Target,
  BarChart2,
  Activity,
} from "lucide-react";

interface IndustryCount {
  industry: string;
  count: number;
}

interface ScoreBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  color: string;
}

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Lead[]>("/api/leads?limit=500")
      .then((res) => setLeads(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500" />
      </div>
    );
  }

  const total = leads.length;
  const scored = leads.filter((l) => l.qualification_score !== null);
  const avgScore =
    scored.length > 0
      ? Math.round(scored.reduce((s, l) => s + (l.qualification_score ?? 0), 0) / scored.length)
      : 0;
  const hot = leads.filter((l) => (l.qualification_score ?? 0) >= 75).length;
  const warm = leads.filter((l) => (l.qualification_score ?? 0) >= 50 && (l.qualification_score ?? 0) < 75).length;
  const cold = leads.filter((l) => l.qualification_score !== null && (l.qualification_score ?? 0) < 50).length;

  const statusCounts = ["new", "contacted", "qualified", "disqualified"].map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
  }));

  const industryCounts: IndustryCount[] = Object.entries(
    leads.reduce((acc: Record<string, number>, l) => {
      const ind = l.industry || "Unknown";
      acc[ind] = (acc[ind] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count);

  const scoreBuckets: ScoreBucket[] = [
    { label: "Hot (75–100)", min: 75, max: 100, count: hot, color: "bg-green-500 shadow-sm" },
    { label: "Warm (50–74)", min: 50, max: 74, count: warm, color: "bg-yellow-500 shadow-sm" },
    { label: "Cold (0–49)", min: 0, max: 49, count: cold, color: "bg-red-500 shadow-sm" },
  ];

  const maxCount = Math.max(...industryCounts.map((i) => i.count), 1);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col p-5 md:p-6 max-w-7xl mx-auto overflow-hidden">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Insights across your lead pipeline</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4 flex-shrink-0">
        <StatCard label="Total Leads" value={total} icon={Users} color="blue" />
        <StatCard label="AI Scored" value={scored.length} icon={Star} color="purple" />
        <StatCard label="Avg. Score" value={scored.length > 0 ? `${avgScore}/100` : "—"} icon={TrendingUp} color="green" />
        <StatCard label="Hot Leads" value={hot} icon={Target} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 flex-shrink-0">
        {/* Score distribution */}
        <div className="card p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-accent-600" />
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Score Distribution</h2>
          </div>
          {scored.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No scored leads yet.</p>
          ) : (
            <div className="space-y-3">
              {scoreBuckets.map((bucket) => (
                <div key={bucket.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 font-medium">{bucket.label}</span>
                    <span className="font-bold text-gray-900">{bucket.count}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className={`h-full rounded-full ${bucket.color} transition-all duration-1000`}
                      style={{ width: scored.length > 0 ? `${(bucket.count / scored.length) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">{scored.length} of {total} leads AI-qualified</p>
              </div>
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="card p-4 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-accent-600" />
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Pipeline Status</h2>
          </div>
          {total === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {statusCounts.map(({ status, count }) => {
                const pct = total > 0 ? (count / total) * 100 : 0;
                const colors: Record<string, string> = {
                  new: "bg-blue-500",
                  contacted: "bg-purple-500",
                  qualified: "bg-green-500",
                  disqualified: "bg-red-500",
                };
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 font-medium capitalize">{status}</span>
                      <span className="font-bold text-gray-900">
                        {count}{" "}
                        <span className="text-gray-400 font-normal">({Math.round(pct)}%)</span>
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div
                        className={`h-full rounded-full ${colors[status]} transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Industry breakdown */}
      <div className="card p-4 bg-white border border-gray-200 shadow-sm flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 mb-3 flex-shrink-0">
          <BarChart2 className="w-4 h-4 text-accent-600" />
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Leads by Industry</h2>
        </div>
        {industryCounts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6 flex-shrink-0">No industry data yet.</p>
        ) : (
          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {industryCounts.map(({ industry, count }) => {
              // Use total leads as base so bars show meaningful relative proportions
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={industry} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-500 w-40 truncate flex-shrink-0">{industry}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                    <div
                      className="h-full bg-accent-500 rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
