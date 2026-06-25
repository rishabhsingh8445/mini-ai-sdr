"use client";

import { useState } from "react";
import { Lead } from "@/types";
import api from "@/lib/axios";
import { formatDateTime, getScoreLabel } from "@/lib/utils";
import {
  Bot,
  Play,
  RefreshCw,
  Sparkles,
  MessageSquare,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QualificationPanelProps {
  lead: Lead;
  onUpdate: (lead: Lead) => void;
}

interface AgentResult {
  qualification_score: number | null;
  qualification_reason: string | null;
  qualification_recommendation: string | null;
  logs: string[];
  error: string | null;
  completed_at: string | null;
}

export function QualificationPanel({ lead, onUpdate }: QualificationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  const hasScore = lead.qualification_score !== null && lead.qualification_score !== undefined;

  const runAgent = async () => {
    setLoading(true);
    setError("");
    setAgentResult(null);
    try {
      // We trigger the LangGraph pipeline here. It's a heavy operation that handles
      // everything (qualification + email). The backend manages the node execution.
      const res = await api.post<AgentResult>(`/api/agent/run/${lead.id}`);
      setAgentResult(res.data);
      
      // The LangGraph pipeline modifies the database directly. 
      // We fetch the updated lead to sync our local React state with the DB.
      const leadRes = await api.get<Lead>(`/api/leads/${lead.id}`);
      onUpdate(leadRes.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Agent run failed. Check your API keys.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    (lead.qualification_score ?? 0) >= 75
      ? { bar: "bg-green-500", badge: "bg-green-50 text-green-700 border-green-200" }
      : (lead.qualification_score ?? 0) >= 50
      ? { bar: "bg-yellow-500", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" }
      : { bar: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" };

  return (
    <div className="card p-5 bg-white border border-gray-200 shadow-sm flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-50 flex items-center justify-center">
            <Bot className="w-4 h-4 text-accent-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-none">AI Analysis</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">LangGraph · OpenAI · Gemini</p>
          </div>
        </div>
        <button
          id="run-ai-agent-btn"
          onClick={runAgent}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : hasScore ? (
            <RefreshCw className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {loading ? "Running…" : hasScore ? "Re-run Agent" : "Run AI Agent"}
        </button>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2 text-red-600 text-xs flex-shrink-0"
          >
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-3 p-3 rounded-xl bg-accent-50 border border-accent-100 flex-shrink-0"
          >
            <p className="text-xs text-accent-700 font-medium flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Running LangGraph pipeline…
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-accent-500">
              {["qualify_lead", "→", "route_by_score", "→", "finalize"].map((s, i) => (
                <span key={i} className={s === "→" ? "opacity-40" : "px-1.5 py-0.5 bg-white rounded-full border border-accent-200"}>
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score + Analysis */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 custom-scrollbar pr-0.5">
        {hasScore ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Score display */}
            <div className="flex items-center justify-between">
              <span className={`badge text-sm px-3 py-1 ${scoreColor.badge}`}>
                {getScoreLabel(lead.qualification_score)} Lead
              </span>
              <div className="text-right">
                <span className="text-4xl font-bold text-gray-900 tracking-tight">{lead.qualification_score}</span>
                <span className="text-gray-400 text-sm">/100</span>
              </div>
            </div>

            {/* Score bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${lead.qualification_score}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className={`h-full rounded-full ${scoreColor.bar}`}
              />
            </div>

            {/* Reason */}
            {lead.qualification_reason && (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Reasoning
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{lead.qualification_reason}</p>
              </div>
            )}

            {/* Recommendation */}
            {lead.qualification_recommendation && (
              <div className="p-3.5 bg-accent-50 border border-accent-100 rounded-xl">
                <p className="text-xs font-semibold text-accent-700 mb-1.5 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Recommendation
                </p>
                <p className="text-sm text-accent-800 leading-relaxed">{lead.qualification_recommendation}</p>
              </div>
            )}

            {/* Agent-run logs */}
            {agentResult?.logs && agentResult.logs.length > 0 && (
              <div>
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showLogs ? "Hide" : "Show"} agent logs ({agentResult.logs.length})
                </button>
                <AnimatePresence>
                  {showLogs && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-gray-900 rounded-xl p-3 max-h-36 overflow-y-auto"
                    >
                      {agentResult.logs.map((log, i) => (
                        <p key={i} className="text-[10px] font-mono text-green-400 leading-relaxed">{log}</p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        ) : (
          /* Empty state */
          <div className="text-center py-8 flex flex-col items-center justify-center h-full">
            <div className="w-14 h-14 mx-auto mb-3 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200">
              <Sparkles className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm text-gray-500 max-w-[180px] leading-relaxed">
              Click <strong>"Run AI Agent"</strong> to qualify this lead and draft an outreach email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
