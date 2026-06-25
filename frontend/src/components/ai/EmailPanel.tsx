"use client";

import { useState, useEffect, useCallback } from "react";
import { Lead, GeneratedEmail } from "@/types";
import api from "@/lib/axios";
import { formatDateTime } from "@/lib/utils";
import { Mail, Sparkles, Copy, Check, Eye, Trash2, Send, Loader2, X, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface EmailPanelProps {
  lead: Lead;
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function EmailPanel({ lead }: EmailPanelProps) {
  const [emails, setEmails] = useState<GeneratedEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [viewingEmail, setViewingEmail] = useState<GeneratedEmail | null>(null);
  const [showAllEmails, setShowAllEmails] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sentIds, setSentIds] = useState<Set<number>>(new Set());
  const [selectedMode, setSelectedMode] = useState("First Contact");

  const MODES = ["First Contact", "Follow Up", "Value Drop", "Breakup"];

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<GeneratedEmail[]>(`/api/ai/emails/${lead.id}`);
      setEmails(res.data);
    } catch {
      // If fetching emails fails, we fail silently. The user just sees an empty state,
      // which is less disruptive than a big red error for a secondary feature.
    } finally {
      setLoading(false);
    }
  }, [lead.id]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const generateEmail = async () => {
    setGenerating(true);
    setError("");
    try {
      // The backend calls the 2-stage Gemini email agent. This can take a few seconds
      // as it analyzes the lead first, then drafts the optimized email.
      const res = await api.post<{ email: GeneratedEmail }>(`/api/ai/email/${lead.id}`, {
        mode: selectedMode
      });
      const newEmail = res.data.email;
      
      // Prepend the new email so it appears at the top of the list immediately.
      setEmails((prev) => [newEmail, ...prev]);
      setViewingEmail(newEmail);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Email generation failed. Check your Gemini API key.");
    } finally {
      setGenerating(false);
    }
  };

  const deleteEmail = async (emailId: number) => {
    setDeletingId(emailId);
    try {
      await api.delete(`/api/ai/email/${emailId}`);
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
      if (viewingEmail?.id === emailId) setViewingEmail(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete email.");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = async (email: GeneratedEmail) => {
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(email.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const playPitch = (email: GeneratedEmail) => {
    // Legacy function, no longer used in EmailPanel
  };

  const sendEmail = async (email: GeneratedEmail) => {
    setSendingId(email.id);
    setError("");
    try {
      await api.post(`/api/ai/email/${email.id}/send`);
      // Fire confetti from the bottom of the screen
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#4ade80', '#10b981', '#3b82f6', '#facc15']
      });
      setSentIds(prev => new Set(prev).add(email.id));
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to dispatch email.");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="card p-5 bg-white border border-gray-200 shadow-sm flex flex-col flex-1 min-h-[300px] relative overflow-hidden mb-4">
      <div className="flex items-center justify-between mb-4 flex-shrink-0 relative z-10 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-50 flex items-center justify-center">
            <Mail className="w-4 h-4 text-accent-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-none">Email Agent</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">2-stage · Gemini AI</p>
          </div>
          {emails.length > 1 && (
            <button
              onClick={() => setShowAllEmails(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-accent-700 bg-accent-100 hover:bg-accent-200 px-2.5 py-1 rounded-lg border border-accent-200 transition-colors"
            >
              <List className="w-3.5 h-3.5" />
              View All ({emails.length})
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          >
            {MODES.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>

          <button
            onClick={generateEmail}
            disabled={generating}
            className="flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:text-accent-700 disabled:opacity-50 transition-colors bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-lg border border-accent-200"
          >
            {generating ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-accent-600" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                {emails.length > 0 ? "New Draft" : "Generate"}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 mb-4 flex-shrink-0 relative z-10">
          {error}
        </motion.div>
      )}

      {loading ? (
        <div className="flex justify-center py-10 flex-1 items-center relative z-10">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600" />
        </div>
      ) : emails.length === 0 ? (
        <div className="text-center py-10 flex-1 flex flex-col justify-center relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 mx-auto mb-3 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200"
          >
            <Mail className="w-7 h-7 text-gray-300" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-gray-500 max-w-[200px] mx-auto leading-relaxed">
            Click <strong>"Generate"</strong> — the Email Agent will analyse this lead and craft a perfectly optimized cold email.
          </motion.p>
        </div>
      ) : (
        <motion.div 
          variants={listVariants} initial="hidden" animate="visible"
          className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar relative z-10"
        >
          <AnimatePresence>
            {emails.map((email) => (
              <motion.div 
                variants={itemVariants} 
                layout
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                key={email.id} 
                className="border border-gray-200 rounded-xl overflow-hidden bg-white transition-all hover:border-gray-300 shadow-sm"
              >
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setViewingEmail(email)}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-semibold text-gray-900 truncate">{email.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(email.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEmail(email.id);
                      }}
                      disabled={deletingId === email.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete email"
                    >
                      {deletingId === email.id ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current block" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(email);
                      }}
                      className="p-1.5 text-gray-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedId === email.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <div className="p-1.5 text-accent-600 bg-accent-50 rounded-lg hover:bg-accent-100 transition-colors ml-1">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {viewingEmail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
              onClick={() => setViewingEmail(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-accent-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">View Email Draft</h3>
                    <p className="text-xs text-gray-500">{formatDateTime(viewingEmail.created_at)}</p>
                  </div>
                </div>
                <button onClick={() => setViewingEmail(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="mb-5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Subject
                  </p>
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 font-semibold text-gray-900">{viewingEmail.subject}</div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Body
                  </p>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-800 whitespace-pre-line leading-relaxed text-[15px]">
                    {viewingEmail.body}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => copyToClipboard(viewingEmail)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-xl text-sm font-semibold transition-all shadow-sm"
                >
                  {copiedId === viewingEmail.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copiedId === viewingEmail.id ? "Copied!" : "Copy Content"}
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => setViewingEmail(null)} className="px-4 py-2.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-xl text-sm font-semibold transition-colors">
                    Close
                  </button>
                  <button
                    onClick={() => sendEmail(viewingEmail)}
                    disabled={sendingId === viewingEmail.id || sentIds.has(viewingEmail.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm",
                      sentIds.has(viewingEmail.id) 
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-accent-600 text-white hover:bg-accent-700 hover:shadow"
                    )}
                  >
                    {sendingId === viewingEmail.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                    ) : sentIds.has(viewingEmail.id) ? (
                      <><Check className="w-4 h-4" /> Sent Successfully</>
                    ) : (
                      <><Send className="w-4 h-4" /> Dispatch Email</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIEW ALL MODAL */}
      <AnimatePresence>
        {showAllEmails && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
              onClick={() => setShowAllEmails(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-gray-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                    <List className="w-5 h-5 text-accent-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">All Generated Emails</h3>
                    <p className="text-xs text-gray-500">History of drafts for this lead</p>
                  </div>
                </div>
                <button onClick={() => setShowAllEmails(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {emails.map((email) => (
                  <div key={email.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{email.subject}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(email.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(email)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold transition-all shadow-sm"
                        >
                          {copiedId === email.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy
                        </button>
                        <button
                          onClick={() => {
                            setShowAllEmails(false);
                            setTimeout(() => setViewingEmail(email), 200);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-50 text-accent-700 hover:bg-accent-100 rounded-lg text-xs font-semibold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> Open
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{email.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
