"use client";

import { useState, useEffect, useCallback } from "react";
import { Lead, CallScript } from "@/types";
import api from "@/lib/axios";
import { formatDateTime } from "@/lib/utils";
import { Mic, Sparkles, Copy, Check, Eye, Trash2, PlaySquare, X, List } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CallScriptPanelProps {
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

const MODES = ["Direct Pitch", "Gatekeeper Bypass", "Voicemail Drop", "Objection Handling"];

export function CallScriptPanel({ lead }: CallScriptPanelProps) {
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [viewingScript, setViewingScript] = useState<CallScript | null>(null);
  const [showAllScripts, setShowAllScripts] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [selectedMode, setSelectedMode] = useState(MODES[0]);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<CallScript[]>(`/api/ai/call-scripts/${lead.id}`);
      setScripts(res.data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [lead.id]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const generateScript = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await api.post<{ script: CallScript }>(`/api/ai/call-script/${lead.id}`, {
        mode: selectedMode
      });
      const newScript = res.data.script;
      setScripts((prev) => [newScript, ...prev]);
      setViewingScript(newScript);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Script generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const deleteScript = async (scriptId: number) => {
    setDeletingId(scriptId);
    try {
      await api.delete(`/api/ai/call-script/${scriptId}`);
      setScripts((prev) => prev.filter((s) => s.id !== scriptId));
      if (viewingScript?.id === scriptId) setViewingScript(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete script.");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = async (script: CallScript) => {
    await navigator.clipboard.writeText(script.script_body);
    setCopiedId(script.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const playPitch = (script: CallScript) => {
    if (playingId === script.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script.script_body);
    utterance.rate = 1.1;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    setPlayingId(script.id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="card p-5 bg-white border border-gray-200 shadow-sm flex flex-col flex-1 min-h-[300px] relative overflow-hidden mt-4">
      <div className="flex items-center justify-between mb-4 flex-shrink-0 relative z-10 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Mic className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-none">Call Scripts</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Voice outreach</p>
          </div>
          {scripts.length > 1 && (
            <button
              onClick={() => setShowAllScripts(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
            >
              <List className="w-3.5 h-3.5" />
              View All ({scripts.length})
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={selectedMode}
            onChange={(e) => setSelectedMode(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {MODES.map(mode => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </select>

          <button
            onClick={generateScript}
            disabled={generating}
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200"
          >
            {generating ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-emerald-600" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate
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
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : scripts.length === 0 ? (
        <div className="text-center py-10 flex-1 flex flex-col justify-center relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 mx-auto mb-3 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200"
          >
            <Mic className="w-7 h-7 text-gray-300" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-gray-500 max-w-[200px] mx-auto leading-relaxed">
            Generate tailored call scripts, voicemail drops, and objection handling lines.
          </motion.p>
        </div>
      ) : (
        <motion.div 
          variants={listVariants} initial="hidden" animate="visible"
          className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar relative z-10"
        >
          <AnimatePresence>
            {scripts.map((script) => (
              <motion.div 
                variants={itemVariants} 
                layout
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                key={script.id} 
                className="border border-emerald-200 rounded-xl overflow-hidden bg-white transition-all hover:border-emerald-300 shadow-sm"
              >
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setViewingScript(script)}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-semibold text-emerald-900 truncate">{script.mode}</p>
                    <p className="text-xs text-emerald-600/70 mt-0.5">{formatDateTime(script.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScript(script.id);
                      }}
                      disabled={deletingId === script.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === script.id ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current block" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(script);
                      }}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      {copiedId === script.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors ml-1">
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
        {viewingScript && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
              onClick={() => setViewingScript(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-emerald-100"
            >
              <div className="flex items-center justify-between p-4 border-b border-emerald-100 bg-emerald-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Mic className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">View Call Script</h3>
                    <p className="text-xs text-gray-500">{formatDateTime(viewingScript.created_at)}</p>
                  </div>
                </div>
                <button onClick={() => setViewingScript(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-emerald-200 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="mb-5">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    Script Mode
                  </p>
                  <div className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 font-semibold text-sm">
                    {viewingScript.mode}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                      Script Content
                    </p>
                  </div>
                  <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-emerald-900 whitespace-pre-line leading-relaxed text-[16px] font-medium shadow-inner">
                    "{viewingScript.script_body}"
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-emerald-100 bg-emerald-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(viewingScript)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl text-sm font-semibold transition-all shadow-sm"
                  >
                    {copiedId === viewingScript.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    {copiedId === viewingScript.id ? "Copied!" : "Copy Text"}
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={() => setViewingScript(null)} className="px-4 py-2.5 text-gray-500 hover:bg-emerald-200 hover:text-gray-900 rounded-xl text-sm font-semibold transition-colors">
                    Close
                  </button>
                  <button 
                    onClick={() => playPitch(viewingScript)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow"
                  >
                    {playingId === viewingScript.id ? (
                      <>Stop Playing</>
                    ) : (
                      <><PlaySquare className="w-4 h-4" /> Listen to Script</>
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
        {showAllScripts && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" 
              onClick={() => setShowAllScripts(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-gray-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-emerald-100"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <List className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">All Call Scripts</h3>
                    <p className="text-xs text-gray-500">History of voice outreach scripts</p>
                  </div>
                </div>
                <button onClick={() => setShowAllScripts(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {scripts.map((script) => (
                  <div key={script.id} className="bg-white border border-emerald-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-emerald-50 bg-emerald-50/30 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">{script.mode}</p>
                        <p className="text-xs text-emerald-600 mt-0.5">{formatDateTime(script.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(script)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold transition-all shadow-sm"
                        >
                          {copiedId === script.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy
                        </button>
                        <button
                          onClick={() => {
                            setShowAllScripts(false);
                            setTimeout(() => setViewingScript(script), 200);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-semibold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> Open
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-emerald-900 whitespace-pre-line leading-relaxed italic">"{script.script_body}"</p>
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
